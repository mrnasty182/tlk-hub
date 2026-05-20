// Simplified database types for TLK Hub
// Will be expanded when real Supabase schema is connected

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      songs: {
        Row: {
          id: string;
          title: string;
          artist: string | null;
          key: string | null;
          tempo: number | null;
          genre: string | null;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist?: string | null;
          key?: string | null;
          tempo?: number | null;
          genre?: string | null;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist?: string | null;
          key?: string | null;
          tempo?: number | null;
          genre?: string | null;
          owner_id?: string;
          created_at?: string;
        };
      };
      setlists: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          type: string;
          date: string;
          time: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          type: string;
          date: string;
          time?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          type?: string;
          date?: string;
          time?: string | null;
          location?: string | null;
          created_at?: string;
        };
      };
    };
  };
}