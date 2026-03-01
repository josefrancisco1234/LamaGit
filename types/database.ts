export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          created_at?: string
        }
        Update: {
          username?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          bonus_balance: number
          total_wagered: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          balance?: number
          bonus_balance?: number
          total_wagered?: number
        }
        Update: {
          balance?: number
          bonus_balance?: number
          total_wagered?: number
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          text: string
          created_at: string
        }
        Insert: {
          user_id: string
          text: string
        }
        Update: never
      }
    }
    Functions: {
      wallet_add: {
        Args: { p_amount: number }
        Returns: number
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Wallet = Database['public']['Tables']['wallets']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
