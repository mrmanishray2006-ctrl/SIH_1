import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'owner' | 'customer';
    storeId?: string;
    phone?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: 'owner' | 'customer';
      storeId?: string;
      phone?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'owner' | 'customer';
    storeId?: string;
    phone?: string | null;
  }
}
