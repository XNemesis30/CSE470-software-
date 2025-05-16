const adminController = require('../../controllers/admin.controller');
const Admin = require('../../models/admin.model');
const bcrypt = require('bcryptjs');

jest.mock('../../models/admin.model');
jest.mock('bcryptjs');

describe('Admin Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerAdmin', () => {
    it('should return 400 if admin already exists', async () => {
      req.body = { email: 'admin@example.com' };
      Admin.findOne.mockResolvedValue({ email: 'admin@example.com' });

      await adminController.registerAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin already exists' });
    });

    it('should create a new admin if email is not taken', async () => {
      req.body = {
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'admin123'
      };
      
      Admin.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockSave = jest.fn().mockResolvedValue({
        _id: 'admin123',
        ...req.body,
        password: 'hashedPassword'
      });
      
      Admin.prototype.save = mockSave;

      await adminController.registerAdmin(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('admin123', 10);
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Admin registered successfully'
      }));
    });
  });

  describe('loginAdmin', () => {
    it('should return 400 if admin not found', async () => {
      req.body = { email: 'admin@example.com', password: 'admin123' };
      Admin.findOne.mockResolvedValue(null);

      await adminController.loginAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('should return 200 and admin data if login successful', async () => {
      const mockAdmin = {
        _id: 'admin123',
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'hashedPassword'
      };
      
      req.body = { email: 'admin@example.com', password: 'admin123' };
      Admin.findOne.mockResolvedValue(mockAdmin);
      bcrypt.compare.mockResolvedValue(true);

      await adminController.loginAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        admin: expect.objectContaining({
          id: 'admin123',
          name: 'Test Admin',
          email: 'admin@example.com'
        })
      });
    });
  });
});