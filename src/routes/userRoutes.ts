import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { validate } from '../middleware/validate';
import { 
    createUserSchema, 
    updateUserSchema, 
    idParamSchema,
    paginationQuerySchema 
} from '../dto/user.dto';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/auth'; // Import authentication middleware

export const userRoutes = Router();

// 🔓 Public route 
userRoutes.post(
    '/',
    validate(createUserSchema),
    asyncHandler(UserController.create)
);

// 🔒 Protected routes (require a valid JWT token)
userRoutes.get(
    '/',
    authMiddleware, // Add auth middleware here
    validate(paginationQuerySchema, 'query'),
    asyncHandler(UserController.getAll)
);

userRoutes.get(
    '/:id',
    authMiddleware, // Add here
    validate(idParamSchema, 'params'),
    asyncHandler(UserController.getById)
);

userRoutes.put(
    '/:id',
    authMiddleware, // Add here
    validate(idParamSchema, 'params'),
    validate(updateUserSchema),
    asyncHandler(UserController.update)
);

userRoutes.delete(
    '/:id',
    authMiddleware, // Add here
    validate(idParamSchema, 'params'),
    asyncHandler(UserController.delete)
);