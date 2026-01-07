import type { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: AuthenticatedUser;
    }
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    req.supabaseUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      
      if (user) {
        req.supabaseUser = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};
