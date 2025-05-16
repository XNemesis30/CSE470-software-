const cartController = require('../../controllers/cart.controller');
const Cart = require('../../models/cart.model');

// Mock the Cart model
jest.mock('../../models/cart.model');

describe('Cart Controller', () => {
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

  describe('removeFromCart', () => {
    it('should return 404 if cart not found', async () => {
      req.params = { customerId: 'CUST123', itemId: 'item123' };
      Cart.findOne.mockResolvedValue(null);

      await cartController.removeFromCart(req, res);

      expect(Cart.findOne).toHaveBeenCalledWith({ customerId: 'CUST123' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cart not found' });
    });

    it('should return 404 if item not found in cart', async () => {
      req.params = { customerId: 'CUST123', itemId: 'item123' };
      const mockCart = {
        customerId: 'CUST123',
        items: [{ _id: 'differentItem', price: 10, quantity: 2 }],
        save: jest.fn()
      };
      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.removeFromCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Item not found in cart' });
    });

    it('should remove item from cart and update total price', async () => {
      req.params = { customerId: 'CUST123', itemId: 'item123' };
      const mockCart = {
        customerId: 'CUST123',
        items: [{ _id: { toString: () => 'item123' }, price: 10, quantity: 2 }],
        totalPrice: 20,
        save: jest.fn().mockResolvedValue(true)
      };
      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.removeFromCart(req, res);

      expect(mockCart.items).toHaveLength(0);
      expect(mockCart.totalPrice).toBe(0);
      expect(mockCart.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Item removed from cart', 
        cart: mockCart 
      });
    });
  });
});

