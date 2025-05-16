const paymentController = require('../../controllers/payment.controller');
const Payment = require('../../models/payment.model');
const Student = require('../../models/student.model');

jest.mock('../../models/payment.model');
jest.mock('../../models/student.model');

describe('Payment Controller', () => {
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

  describe('processPayment', () => {
    it('should return 400 if payment method is not supported', async () => {
      req.body = { 
        customerId: 'CUST123',
        amount: 50,
        paymentMethod: 'bitcoin' // Unsupported method
      };

      await paymentController.processPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Payment method not supported' 
      });
    });

    it('should process card payment successfully', async () => {
      req.body = {
        customerId: 'CUST123',
        amount: 50,
        paymentMethod: 'card',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123'
        }
      };
      
      const mockPayment = {
        _id: 'payment123',
        customerId: 'CUST123',
        amount: 50,
        paymentMethod: 'card',
        status: 'completed',
        transactionId: expect.any(String),
        createdAt: expect.any(Date)
      };
      
      Payment.create.mockResolvedValue(mockPayment);

      await paymentController.processPayment(req, res);

      expect(Payment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Payment processed successfully',
        payment: mockPayment
      });
    });

    it('should process wallet payment and update student wallet', async () => {
      req.body = {
        customerId: 'CUST123',
        amount: 50,
        paymentMethod: 'wallet'
      };
      
      const mockStudent = {
        _id: 'student123',
        customerId: 'CUST123',
        wallet: 100
      };
      
      Student.findOne.mockResolvedValue(mockStudent);
      Student.findOneAndUpdate.mockResolvedValue({
        ...mockStudent,
        wallet: 50 // 100 - 50
      });
      
      const mockPayment = {
        _id: 'payment123',
        customerId: 'CUST123',
        amount: 50,
        paymentMethod: 'wallet',
        status: 'completed',
        transactionId: expect.any(String),
        createdAt: expect.any(Date)
      };
      
      Payment.create.mockResolvedValue(mockPayment);

      await paymentController.processPayment(req, res);

      expect(Student.findOne).toHaveBeenCalledWith({ customerId: 'CUST123' });
      expect(Student.findOneAndUpdate).toHaveBeenCalledWith(
        { customerId: 'CUST123' },
        { wallet: 50 },
        { new: true }
      );
      expect(Payment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Payment processed successfully',
        payment: mockPayment
      });
    });

    it('should return 400 if wallet has insufficient funds', async () => {
      req.body = {
        customerId: 'CUST123',
        amount: 150,
        paymentMethod: 'wallet'
      };
      
      const mockStudent = {
        _id: 'student123',
        customerId: 'CUST123',
        wallet: 100 // Less than amount
      };
      
      Student.findOne.mockResolvedValue(mockStudent);

      await paymentController.processPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Insufficient funds in wallet' 
      });
    });
  });

  describe('getPaymentsByCustomerId', () => {
    it('should return payments for a customer', async () => {
      req.params.customerId = 'CUST123';
      
      const mockPayments = [
        { _id: 'payment1', customerId: 'CUST123', amount: 50 },
        { _id: 'payment2', customerId: 'CUST123', amount: 30 }
      ];
      
      Payment.find.mockResolvedValue(mockPayments);

      await paymentController.getPaymentsByCustomerId(req, res);

      expect(Payment.find).toHaveBeenCalledWith({ customerId: 'CUST123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPayments);
    });
  });

  describe('addToWallet', () => {
    it('should add amount to student wallet', async () => {
      req.body = {
        customerId: 'CUST123',
        amount: 50
      };
      
      const mockStudent = {
        _id: 'student123',
        customerId: 'CUST123',
        wallet: 100
      };
      
      Student.findOne.mockResolvedValue(mockStudent);
      Student.findOneAndUpdate.mockResolvedValue({
        ...mockStudent,
        wallet: 150 // 100 + 50
      });
      
      const mockPayment = {
        _id: 'payment123',
        customerId: 'CUST123',
        amount: 50,
        paymentMethod: 'wallet_recharge',
        status: 'completed',
        transactionId: expect.any(String)
      };
      
      Payment.create.mockResolvedValue(mockPayment);

      await paymentController.addToWallet(req, res);

      expect(Student.findOne).toHaveBeenCalledWith({ customerId: 'CUST123' });
      expect(Student.findOneAndUpdate).toHaveBeenCalledWith(
        { customerId: 'CUST123' },
        { wallet: 150 },
        { new: true }
      );
      expect(Payment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Amount added to wallet successfully',
        student: expect.objectContaining({
          wallet: 150
        }),
        payment: mockPayment
      });
    });

    it('should return 404 if student not found', async () => {
      req.body = {
        customerId: 'CUST123',
        amount: 50
      };
      
      Student.findOne.mockResolvedValue(null);

      await paymentController.addToWallet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Student not found' 
      });
    });
  });

  describe('getWalletBalance', () => {
    it('should return wallet balance for a customer', async () => {
      req.params.customerId = 'CUST123';
      
      const mockStudent = {
        _id: 'student123',
        customerId: 'CUST123',
        wallet: 150
      };
      
      Student.findOne.mockResolvedValue(mockStudent);

      await paymentController.getWalletBalance(req, res);

      expect(Student.findOne).toHaveBeenCalledWith({ customerId: 'CUST123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        balance: 150 
      });
    });

    it('should return 404 if student not found', async () => {
      req.params.customerId = 'CUST123';
      Student.findOne.mockResolvedValue(null);

      await paymentController.getWalletBalance(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Student not found' 
      });
    });
  });
});