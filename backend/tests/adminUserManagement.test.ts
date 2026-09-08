import { initDatabase, db } from '../src/database/db';
import { userRepo, userAuditRepo } from '../src/repositories';
import { authController } from '../src/controllers';

describe('Admin User Management & Audit System', () => {
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

  test('admin user exists from database initialization', () => {
    const admin = userRepo.findByEmail('admin@gam.io');
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('admin');
    expect(admin?.status).toBe('active');
  });

  test('non-admin user is rejected from admin-only endpoints with 403', async () => {
    // Non-admin partner user
    const partnerUser = userRepo.findByEmail('blink@gam.io');
    expect(partnerUser).toBeDefined();

    const { req, res, getStatus } = makeReqRes({
      user: { id: partnerUser!.id, email: partnerUser!.email }
    });

    // 1. List users
    await authController.listUsers(req, res);
    expect(getStatus()).toBe(403);

    // 2. Register user
    await authController.register(req, res);
    expect(getStatus()).toBe(403);

    // 3. Update user
    await authController.updateUser(req, res);
    expect(getStatus()).toBe(403);

    // 4. Reset user password
    await authController.resetUserPassword(req, res);
    expect(getStatus()).toBe(403);

    // 5. Toggle status
    await authController.toggleUserStatus(req, res);
    expect(getStatus()).toBe(403);

    // 6. Delete user
    await authController.deleteUser(req, res);
    expect(getStatus()).toBe(403);

    // 7. Audit logs
    await authController.listAuditLogs(req, res);
    expect(getStatus()).toBe(403);
  });

  test('admin can create a new user with partner and advertiser scoping, and audit is logged', async () => {
    const admin = userRepo.findByEmail('admin@gam.io')!;
    const testEmail = `operator_${Date.now()}@test.io`;

    const { req, res, getStatus, getBody } = makeReqRes({
      user: { id: admin.id, email: admin.email },
      body: {
        name: 'Test Operator',
        email: testEmail,
        password: 'OperatorPassword123!',
        role: 'manager',
        networkCode: '22068249324',
        partnerName: 'Blinkcorp Technologies Private Limited',
        advertiserId: '6156180870',
        advertiserName: 'ABHishke',
        status: 'active'
      }
    });

    await authController.register(req, res);
    expect(getStatus()).toBe(201);
    const createdUser = getBody().data.user;
    expect(createdUser.email).toBe(testEmail);
    expect(createdUser.role).toBe('manager');
    expect(createdUser.partnerName).toBe('Blinkcorp Technologies Private Limited');
    expect(createdUser.advertiserName).toBe('ABHishke');
    expect(createdUser.status).toBe('active');

    // Verify audit log
    const auditLogs = userAuditRepo.list(10);
    const createLog = auditLogs.find(l => l.targetUserId === createdUser.id && l.action === 'USER_CREATED');
    expect(createLog).toBeDefined();
    expect(createLog?.adminEmail).toBe(admin.email);
    expect(createLog?.details?.role).toBe('manager');
  });

  test('admin can edit an existing user details', async () => {
    const admin = userRepo.findByEmail('admin@gam.io')!;
    const testUser = userRepo.create({
      name: 'Original Name',
      email: `user_to_edit_${Date.now()}@test.io`,
      password: 'InitPassword123!',
      role: 'trafficker',
      partnerName: 'Blinkcorp Technologies Private Limited',
      networkCode: '22068249324'
    });

    const updatedName = 'Updated Name Officer';
    const { req, res, getStatus, getBody } = makeReqRes({
      user: { id: admin.id, email: admin.email },
      params: { id: testUser.id },
      body: {
        name: updatedName,
        role: 'manager',
        partnerName: 'The Federal',
        networkCode: '22665183713'
      }
    });

    await authController.updateUser(req, res);
    expect(getStatus()).toBe(200);
    expect(getBody().data.name).toBe(updatedName);
    expect(getBody().data.role).toBe('manager');
    expect(getBody().data.partnerName).toBe('The Federal');

    // Verify user in repo
    const fetched = userRepo.findById(testUser.id);
    expect(fetched?.name).toBe(updatedName);
    expect(fetched?.role).toBe('manager');

    // Clean up
    userRepo.delete(testUser.id);
  });

  test('admin cannot demote or deactivate their own admin account', async () => {
    const admin = userRepo.findByEmail('admin@gam.io')!;

    // Try to deactivate self
    const { req: req1, res: res1, getStatus: getStatus1 } = makeReqRes({
      user: { id: admin.id, email: admin.email },
      params: { id: admin.id },
      body: { status: 'deactivated' }
    });

    await authController.toggleUserStatus(req1, res1);
    expect(getStatus1()).toBe(400);

    // Try to demote self via updateUser
    const { req: req2, res: res2, getStatus: getStatus2 } = makeReqRes({
      user: { id: admin.id, email: admin.email },
      params: { id: admin.id },
      body: { role: 'viewer' }
    });

    await authController.updateUser(req2, res2);
    expect(getStatus2()).toBe(400);

    // Try to delete self
    const { req: req3, res: res3, getStatus: getStatus3 } = makeReqRes({
      user: { id: admin.id, email: admin.email },
      params: { id: admin.id }
    });

    await authController.deleteUser(req3, res3);
    expect(getStatus3()).toBe(400);
  });

  test('admin resets user password, generates temporary password, and forces mustChangePassword', async () => {
    const admin = userRepo.findByEmail('admin@gam.io')!;
    const testUser = userRepo.create({
      name: 'Reset Password Target',
      email: `reset_target_${Date.now()}@test.io`,
      password: 'OldPassword123!',
      role: 'trafficker'
    });

    const { req, res, getStatus, getBody } = makeReqRes({
      user: { id: admin.id, email: admin.email },
      params: { id: testUser.id },
      body: {} // empty newPassword means generate secure temporary password
    });

    await authController.resetUserPassword(req, res);
    expect(getStatus()).toBe(200);
    const tempPassword = getBody().data.temporaryPassword;
    expect(tempPassword).toBeDefined();
    expect(tempPassword.length).toBeGreaterThanOrEqual(8);
    expect(getBody().data.mustChangePassword).toBe(true);

    // Verify user mustChangePassword flag in DB
    const fetched = userRepo.findById(testUser.id);
    expect(fetched?.mustChangePassword).toBe(true);

    // Try logging in with the temp password
    const { req: loginReq, res: loginRes, getStatus: loginStatus, getBody: loginBody } = makeReqRes({
      body: {
        email: testUser.email,
        password: tempPassword
      }
    });

    await authController.login(loginReq, loginRes);
    expect(loginStatus()).toBe(200);
    expect(loginBody().data.user.mustChangePassword).toBe(true);

    // User changes own password
    const userToken = loginBody().data.token;
    const changeReq: any = {
      headers: { authorization: `Bearer ${userToken}` },
      body: {
        currentPassword: tempPassword,
        newPassword: 'MyNewSecretPassword2026!'
      }
    };
    let changeStatus = 200, changeBody: any = null;
    const changeRes: any = {
      status(c: number) { changeStatus = c; return this; },
      json(d: any) { changeBody = d; return this; }
    };

    await authController.changePassword(changeReq, changeRes);
    expect(changeStatus).toBe(200);

    // Verify mustChangePassword is now false
    const afterChange = userRepo.findById(testUser.id);
    expect(afterChange?.mustChangePassword).toBe(false);

    // Clean up
    userRepo.delete(testUser.id);
  });

  test('user deactivation blocks login with 403, reactivation allows login', async () => {
    const admin = userRepo.findByEmail('admin@gam.io')!;
    const testUser = userRepo.create({
      name: 'Status Toggle Target',
      email: `status_toggle_${Date.now()}@test.io`,
      password: 'StatusPassword123!',
      role: 'trafficker',
      status: 'active'
    });

    // 1. Deactivate
    const { req: deactReq, res: deactRes, getStatus: deactStatus } = makeReqRes({
      user: { id: admin.id, email: admin.email },
      params: { id: testUser.id },
      body: { status: 'deactivated' }
    });
    await authController.toggleUserStatus(deactReq, deactRes);
    expect(deactStatus()).toBe(200);

    // 2. Try login with deactivated account -> 403
    const { req: loginReq, res: loginRes, getStatus: loginStatus, getBody: loginBody } = makeReqRes({
      body: {
        email: testUser.email,
        password: 'StatusPassword123!'
      }
    });
    await authController.login(loginReq, loginRes);
    expect(loginStatus()).toBe(403);
    expect(loginBody().error).toContain('deactivated');

    // 3. Reactivate
    const { req: reactReq, res: reactRes, getStatus: reactStatus } = makeReqRes({
      user: { id: admin.id, email: admin.email },
      params: { id: testUser.id },
      body: { status: 'active' }
    });
    await authController.toggleUserStatus(reactReq, reactRes);
    expect(reactStatus()).toBe(200);

    // 4. Try login again -> 200 Success
    const { req: login2Req, res: login2Res, getStatus: login2Status } = makeReqRes({
      body: {
        email: testUser.email,
        password: 'StatusPassword123!'
      }
    });
    await authController.login(login2Req, login2Res);
    expect(login2Status()).toBe(200);

    // Clean up
    userRepo.delete(testUser.id);
  });

  test('soft delete sets is_deleted = 1 and deactivated status, preserving data without showing in list', async () => {
    const admin = userRepo.findByEmail('admin@gam.io')!;
    const testUser = userRepo.create({
      name: 'Delete Target User',
      email: `delete_target_${Date.now()}@test.io`,
      password: 'DeletePassword123!',
      role: 'viewer',
      status: 'active'
    });

    const { req: delReq, res: delRes, getStatus: delStatus } = makeReqRes({
      user: { id: admin.id, email: admin.email },
      params: { id: testUser.id }
    });

    await authController.deleteUser(delReq, delRes);
    expect(delStatus()).toBe(200);

    // Verify soft-deleted
    const userInDb = userRepo.findById(testUser.id);
    expect(userInDb?.isDeleted).toBe(true);
    expect(userInDb?.status).toBe('deactivated');

    // Verify omitted from standard active list
    const activeList = userRepo.list(false);
    expect(activeList.some(u => u.id === testUser.id)).toBe(false);

    // Verify login is blocked
    const { req: loginReq, res: loginRes, getStatus: loginStatus } = makeReqRes({
      body: {
        email: testUser.email,
        password: 'DeletePassword123!'
      }
    });
    await authController.login(loginReq, loginRes);
    expect(loginStatus()).toBe(403);

    // Hard cleanup
    userRepo.delete(testUser.id);
  });

  test('user audit logs never expose plain passwords and accurately record admin actions', async () => {
    const logs = userAuditRepo.list(50);
    expect(logs.length).toBeGreaterThan(0);

    for (const log of logs) {
      // Ensure no password properties are ever stored
      if (log.details) {
        expect(log.details.password).toBeUndefined();
        expect(log.details.newPassword).toBeUndefined();
        expect(log.details.passwordHash).toBeUndefined();
        expect(log.details.salt).toBeUndefined();
      }
    }
  });
});
