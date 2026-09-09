import { Request, Response } from 'express';
import { clientRepo, userAuditRepo } from '../repositories';
import { GamClientService } from '../services/gamClientService';
import { getAuthUser } from './index';

export const clientController = {
  /**
   * List all configured Google Ad Manager clients (Admin only)
   */
  async list(req: Request, res: Response) {
    try {
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only administrators with Network Code management permission can view or manage Google Ad Manager clients.'
        });
      }

      const clients = clientRepo.list();
      return res.json({ success: true, data: clients });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Get client by ID (Admin only)
   */
  async getById(req: Request, res: Response) {
    try {
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only administrators can view client details.'
        });
      }

      const id = String(req.params.id);
      const client = clientRepo.findById(id);
      if (!client) {
        return res.status(404).json({ success: false, error: `Client ${id} not found.` });
      }

      return res.json({ success: true, data: client });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Test network connectivity & preview GAM account info before creating (Admin only)
   */
  async testNetwork(req: Request, res: Response) {
    try {
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only administrators can test network configurations.'
        });
      }

      const { networkCode, credentialsType, serviceAccountKey, refreshToken } = req.body;
      if (!networkCode || !String(networkCode).trim()) {
        return res.status(400).json({ success: false, error: 'Network Code is required.' });
      }

      const cleanCode = String(networkCode).trim();
      const pullResult = await GamClientService.pullAccountInfo(cleanCode, {
        credentialsType,
        serviceAccountKey,
        refreshToken
      });

      return res.json({
        success: pullResult.success,
        data: pullResult,
        message: pullResult.success
          ? `Successfully connected to Google Ad Manager Network ${cleanCode}!`
          : (pullResult.error || 'Failed to pull network details.')
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Onboard and configure a new GAM client (Admin only)
   * Automatically connects to GAM and pulls account details.
   */
  async create(req: Request, res: Response) {
    try {
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only administrators with Network Code management permission can onboard clients.'
        });
      }

      const { clientName, networkCode, credentialsType, serviceAccountKey, refreshToken, clientEmail, notes, status, autoPullInfo } = req.body;

      if (!clientName || !clientName.trim()) {
        return res.status(400).json({ success: false, error: 'Client / Account Name is required.' });
      }

      if (!networkCode || !String(networkCode).trim()) {
        return res.status(400).json({ success: false, error: 'Network Code is required.' });
      }

      const cleanCode = String(networkCode).trim();

      // Check for duplicate network code
      const existing = clientRepo.findByNetworkCode(cleanCode);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: `A client with Network Code "${cleanCode}" is already configured (${existing.clientName}).`
        });
      }

      // If custom service account key provided, validate JSON
      if (credentialsType === 'CUSTOM_SERVICE_ACCOUNT' && serviceAccountKey) {
        try {
          const parsed = typeof serviceAccountKey === 'string' ? JSON.parse(serviceAccountKey) : serviceAccountKey;
          if (!parsed.client_email || !parsed.private_key) {
            return res.status(400).json({
              success: false,
              error: 'Invalid Service Account JSON: "client_email" and "private_key" are required.'
            });
          }
        } catch (e: any) {
          return res.status(400).json({ success: false, error: 'Invalid Service Account JSON format: ' + e.message });
        }
      }

      // 1. Create client record
      const client = clientRepo.create({
        clientName: clientName.trim(),
        networkCode: cleanCode,
        credentialsType: credentialsType || 'GLOBAL_SERVICE_ACCOUNT',
        serviceAccountKey,
        refreshToken,
        clientEmail: clientEmail ? clientEmail.trim() : undefined,
        notes: notes ? notes.trim() : undefined,
        status: status || 'ACTIVE',
        createdBy: `${caller.name} (${caller.email})`
      });

      // 2. Automatically pull GAM account information
      let pullResult: any = null;
      if (autoPullInfo !== false) {
        try {
          const syncRes = await GamClientService.syncClientAccount(client.id);
          pullResult = syncRes.result;
        } catch (pullErr: any) {
          console.warn('[clientController] Auto-pull error:', pullErr.message);
        }
      }

      const updatedClient = clientRepo.findById(client.id);

      // 3. Log administrative audit action
      userAuditRepo.logAction({
        adminId: caller.id,
        adminEmail: caller.email,
        targetUserId: client.id,
        targetUserEmail: client.clientEmail || caller.email,
        action: 'CLIENT_ONBOARDED',
        details: {
          clientId: client.id,
          clientName: client.clientName,
          networkCode: client.networkCode,
          credentialsType: client.credentialsType,
          syncStatus: updatedClient?.syncStatus,
          advertisersDiscovered: pullResult?.advertisersCount || 0
        }
      });

      return res.status(201).json({
        success: true,
        message: `Google Ad Manager client "${client.clientName}" onboarded successfully!`,
        data: updatedClient,
        pullResult
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Update client configuration (Admin only)
   */
  async update(req: Request, res: Response) {
    try {
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only administrators can edit client configurations.'
        });
      }

      const id = String(req.params.id);
      const existing = clientRepo.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Client ${id} not found.` });
      }

      const updated = clientRepo.update(id, req.body);

      userAuditRepo.logAction({
        adminId: caller.id,
        adminEmail: caller.email,
        targetUserId: id,
        targetUserEmail: existing.clientEmail || caller.email,
        action: 'CLIENT_UPDATED',
        details: {
          clientId: id,
          clientName: updated?.clientName,
          networkCode: updated?.networkCode,
          status: updated?.status
        }
      });

      return res.json({
        success: true,
        message: `Client "${updated?.clientName}" updated successfully.`,
        data: updated
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Pull / refresh account info from Google Ad Manager on demand (Admin only)
   */
  async pullInfo(req: Request, res: Response) {
    try {
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only administrators can trigger GAM account sync.'
        });
      }

      const id = String(req.params.id);
      const client = clientRepo.findById(id);
      if (!client) {
        return res.status(404).json({ success: false, error: `Client ${id} not found.` });
      }

      const syncRes = await GamClientService.syncClientAccount(id);

      userAuditRepo.logAction({
        adminId: caller.id,
        adminEmail: caller.email,
        targetUserId: id,
        targetUserEmail: client.clientEmail || caller.email,
        action: 'CLIENT_SYNCED',
        details: {
          clientId: id,
          networkCode: client.networkCode,
          syncStatus: syncRes.client?.syncStatus,
          advertisersCount: syncRes.result.advertisersCount
        }
      });

      return res.json({
        success: syncRes.success,
        message: syncRes.success
          ? `Successfully pulled account info for ${client.clientName} (${syncRes.result.advertisersCount} advertisers discovered).`
          : (syncRes.result.error || 'Failed to pull GAM account information.'),
        data: syncRes.client,
        pullResult: syncRes.result
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Delete a client configuration (Admin only)
   */
  async delete(req: Request, res: Response) {
    try {
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only administrators can delete clients.'
        });
      }

      const id = String(req.params.id);
      const client = clientRepo.findById(id);
      if (!client) {
        return res.status(404).json({ success: false, error: `Client ${id} not found.` });
      }

      clientRepo.delete(id);

      userAuditRepo.logAction({
        adminId: caller.id,
        adminEmail: caller.email,
        targetUserId: id,
        targetUserEmail: client.clientEmail || caller.email,
        action: 'CLIENT_DELETED',
        details: {
          clientId: id,
          clientName: client.clientName,
          networkCode: client.networkCode
        }
      });

      return res.json({
        success: true,
        message: `Client "${client.clientName}" (${client.networkCode}) deleted successfully.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};
