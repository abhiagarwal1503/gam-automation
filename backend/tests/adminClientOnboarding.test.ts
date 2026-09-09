import { initDatabase, db } from '../src/database/db';
import { userRepo, clientRepo, userAuditRepo, advertiserRepo } from '../src/repositories';
import { clientController, gamLiveController } from '../src/controllers';

describe('Admin Network Code Permission & Client Onboarding', () => {
  beforeAll(() => {
    initDatabase();
  });

  const makeReqRes = (options: {
    user?: { id: string; email: string };
    body?: any;
    params?: any;
    query?: any;
  }) => {
    let statusCode = 200;
    let jsonBody: any = null;

    const token = options.user
      ? Buffer.from(JSON.stringify({ id: options.user.id, email: options.user.email, exp: Date.now() + 100000 })).toString('base64')
      : undefined;

    const req: any = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: options.body || {},
      params: options.params || {},
      query: options.query || {}
    };

    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      }
    };

    return {
      req,
      res,
      getStatus: () => statusCode,
      getBody: () => jsonBody
    };
  };

  test('non-admin user is rejected from client management endpoints with 403', async () => {
    const partnerUser = userRepo.findByEmail('blink@gam.io');
    expect(partnerUser).toBeDefined();

    // 1. List clients
    const { req: req1, res: res1, getStatus: getStatus1 } = makeReqRes({ user: partnerUser! });
    await clientController.list(req1, res1);
    expect(getStatus1()).toBe(403);

    // 2. Create client
    const { req: req2, res: res2, getStatus: getStatus2, getBody: getBody2 } = makeReqRes({
      user: partnerUser!,
      body: { clientName: 'Hacker Client', networkCode: '9999999999' }
    });
    await clientController.create(req2, res2);
    expect(getStatus2()).toBe(403);
    expect(getBody2().error).toContain('Access Denied');

    // 3. Test network
    const { req: req3, res: res3, getStatus: getStatus3 } = makeReqRes({
      user: partnerUser!,
      body: { networkCode: '9999999999' }
    });
    await clientController.testNetwork(req3, res3);
    expect(getStatus3()).toBe(403);

    // 4. Delete client
    const { req: req4, res: res4, getStatus: getStatus4 } = makeReqRes({
      user: partnerUser!,
      params: { id: 'client_22068249324_001' }
    });
    await clientController.delete(req4, res4);
    expect(getStatus4()).toBe(403);
  });

  test('admin can list configured GAM clients', async () => {
    const admin = userRepo.findByEmail('admin@gam.io');
    expect(admin).toBeDefined();

    const { req, res, getStatus, getBody } = makeReqRes({ user: admin! });
    await clientController.list(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);
    expect(Array.isArray(getBody().data)).toBe(true);
    expect(getBody().data.length).toBeGreaterThan(0);

    const blinkClient = getBody().data.find((c: any) => c.networkCode === '22068249324');
    expect(blinkClient).toBeDefined();
    expect(blinkClient.clientName).toContain('Blinkcorp');
  });

  test('admin can preview / test network details before onboarding', async () => {
    const admin = userRepo.findByEmail('admin@gam.io');
    const { req, res, getStatus, getBody } = makeReqRes({
      user: admin!,
      body: { networkCode: '22068249324' }
    });

    await clientController.testNetwork(req, res);
    expect(getStatus()).toBe(200);
    expect(getBody().data).toBeDefined();
    expect(getBody().data.networkCode).toBe('22068249324');
  });

  test('admin can onboard a new GAM client with automated info pulling and advertiser mapping', async () => {
    const admin = userRepo.findByEmail('admin@gam.io');
    const testNetCode = '22665183713'; // The Federal test client

    // Clean up if existing from prior test runs
    const existing = clientRepo.findByNetworkCode(testNetCode);
    if (existing) {
      clientRepo.delete(existing.id);
    }

    const { req, res, getStatus, getBody } = makeReqRes({
      user: admin!,
      body: {
        clientName: 'The Federal Digital Media',
        networkCode: testNetCode,
        credentialsType: 'GLOBAL_SERVICE_ACCOUNT',
        clientEmail: 'adops@thefederal.com',
        notes: 'Primary publisher account for south regional news',
        autoPullInfo: true
      }
    });

    await clientController.create(req, res);
    expect(getStatus()).toBe(201);
    expect(getBody().success).toBe(true);
    expect(getBody().data).toBeDefined();
    expect(getBody().data.clientName).toBe('The Federal Digital Media');
    expect(getBody().data.networkCode).toBe(testNetCode);
    expect(getBody().data.status).toBe('ACTIVE');

    // Verify account info was pulled & mapped
    const onboarded = clientRepo.findByNetworkCode(testNetCode);
    expect(onboarded).toBeDefined();
    expect(onboarded?.accountInfo).toBeDefined();
    expect(onboarded?.accountInfo?.networkCode).toBe(testNetCode);

    // Verify discovered advertisers were mapped for this network
    const networkAdvertisers = advertiserRepo.list(testNetCode);
    expect(networkAdvertisers.length).toBeGreaterThan(0);

    // Verify audit log
    const auditLogs = userAuditRepo.list(10);
    const onboardAudit = auditLogs.find(l => l.action === 'CLIENT_ONBOARDED' && l.details?.networkCode === testNetCode);
    expect(onboardAudit).toBeDefined();
    expect(onboardAudit?.adminEmail).toBe(admin?.email);
  });

  test('prevent onboarding duplicate network code', async () => {
    const admin = userRepo.findByEmail('admin@gam.io');
    const { req, res, getStatus, getBody } = makeReqRes({
      user: admin!,
      body: {
        clientName: 'Duplicate Attempt',
        networkCode: '22665183713'
      }
    });

    await clientController.create(req, res);
    expect(getStatus()).toBe(409);
    expect(getBody().error).toContain('already configured');
  });

  test('dynamically merges onboarded client into platform network resolvers', async () => {
    const admin = userRepo.findByEmail('admin@gam.io');
    const { req, res, getStatus, getBody } = makeReqRes({ user: admin! });

    await gamLiveController.getNetworks(req, res);
    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);

    const federalNetwork = getBody().data.find((n: any) => n.code === '22665183713');
    expect(federalNetwork).toBeDefined();
  });

  test('admin can update client settings and trigger on-demand GAM account sync', async () => {
    const admin = userRepo.findByEmail('admin@gam.io');
    const client = clientRepo.findByNetworkCode('22665183713');
    expect(client).toBeDefined();

    // 1. Update client
    const { req: req1, res: res1, getStatus: getStatus1, getBody: getBody1 } = makeReqRes({
      user: admin!,
      params: { id: client!.id },
      body: {
        clientName: 'The Federal News Network (Updated)',
        notes: 'Updated publisher scope notes'
      }
    });

    await clientController.update(req1, res1);
    expect(getStatus1()).toBe(200);
    expect(getBody1().data.clientName).toBe('The Federal News Network (Updated)');

    // 2. Trigger on-demand sync
    const { req: req2, res: res2, getStatus: getStatus2, getBody: getBody2 } = makeReqRes({
      user: admin!,
      params: { id: client!.id }
    });

    await clientController.pullInfo(req2, res2);
    expect(getStatus2()).toBe(200);
    expect(getBody2().data.lastSyncedAt).toBeDefined();

    // Verify audit log
    const auditLogs = userAuditRepo.list(10);
    const syncAudit = auditLogs.find(l => l.action === 'CLIENT_SYNCED' && l.details?.clientId === client!.id);
    expect(syncAudit).toBeDefined();
  });

  test('admin can delete configured client', async () => {
    const admin = userRepo.findByEmail('admin@gam.io');
    const client = clientRepo.findByNetworkCode('22665183713');
    expect(client).toBeDefined();

    const { req, res, getStatus, getBody } = makeReqRes({
      user: admin!,
      params: { id: client!.id }
    });

    await clientController.delete(req, res);
    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);

    const deleted = clientRepo.findById(client!.id);
    expect(deleted).toBeNull();

    // Verify audit log
    const auditLogs = userAuditRepo.list(10);
    const deleteAudit = auditLogs.find(l => l.action === 'CLIENT_DELETED' && l.details?.clientId === client!.id);
    expect(deleteAudit).toBeDefined();
  });
});
