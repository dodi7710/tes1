// Auto-generated from the Supabase project schema (project: kasir-susu-murni).
// Regenerate with the Supabase MCP `generate_typescript_types` tool after schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      menu_categories: {
        Row: {
          id: string
          nama: string
          urutan: number
        }
        Insert: {
          id?: string
          nama: string
          urutan?: number
        }
        Update: {
          id?: string
          nama?: string
          urutan?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          harga: number
          id: string
          kategori_id: string | null
          nama: string
          status_aktif: boolean
        }
        Insert: {
          created_at?: string
          harga: number
          id?: string
          kategori_id?: string | null
          nama: string
          status_aktif?: boolean
        }
        Update: {
          created_at?: string
          harga?: number
          id?: string
          kategori_id?: string | null
          nama?: string
          status_aktif?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          alasan_batal: string | null
          dibatalkan_oleh: string | null
          dibatalkan_pada: string | null
          dibuat_pada: string
          dicetak_dapur: boolean
          harga_saat_itu: number
          id: string
          menu_item_id: string
          nama_item: string
          order_id: string
          qty: number
          status: string
        }
        Insert: {
          alasan_batal?: string | null
          dibatalkan_oleh?: string | null
          dibatalkan_pada?: string | null
          dibuat_pada?: string
          dicetak_dapur?: boolean
          harga_saat_itu: number
          id?: string
          menu_item_id: string
          nama_item: string
          order_id: string
          qty?: number
          status?: string
        }
        Update: {
          alasan_batal?: string | null
          dibatalkan_oleh?: string | null
          dibatalkan_pada?: string | null
          dibuat_pada?: string
          dicetak_dapur?: boolean
          harga_saat_itu?: number
          id?: string
          menu_item_id?: string
          nama_item?: string
          order_id?: string
          qty?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_dibatalkan_oleh_fkey"
            columns: ["dibatalkan_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          dibuka_oleh: string
          dibuka_pada: string
          ditutup_pada: string | null
          id: string
          meja_id: string
          shift_id: string
          status: string
        }
        Insert: {
          dibuka_oleh: string
          dibuka_pada?: string
          ditutup_pada?: string | null
          id?: string
          meja_id: string
          shift_id: string
          status?: string
        }
        Update: {
          dibuka_oleh?: string
          dibuka_pada?: string
          ditutup_pada?: string | null
          id?: string
          meja_id?: string
          shift_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_dibuka_oleh_fkey"
            columns: ["dibuka_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_meja_id_fkey"
            columns: ["meja_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          dibuat_pada: string
          diskon: number
          id: string
          jumlah_dibayar: number | null
          kasir_id: string
          kembalian: number | null
          metode: string
          order_id: string
          shift_id: string
          subtotal: number
          total: number
        }
        Insert: {
          dibuat_pada?: string
          diskon?: number
          id?: string
          jumlah_dibayar?: number | null
          kasir_id: string
          kembalian?: number | null
          metode: string
          order_id: string
          shift_id: string
          subtotal: number
          total: number
        }
        Update: {
          dibuat_pada?: string
          diskon?: number
          id?: string
          jumlah_dibayar?: number | null
          kasir_id?: string
          kembalian?: number | null
          metode?: string
          order_id?: string
          shift_id?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_kasir_id_fkey"
            columns: ["kasir_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          role: string
          status_aktif: boolean
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          role: string
          status_aktif?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          role?: string
          status_aktif?: boolean
        }
        Relationships: []
      }
      shifts: {
        Row: {
          id: string
          kas_fisik_akhir: number | null
          kasir_id: string
          modal_awal: number
          selisih: number | null
          status: string
          waktu_buka: string
          waktu_tutup: string | null
        }
        Insert: {
          id?: string
          kas_fisik_akhir?: number | null
          kasir_id: string
          modal_awal: number
          selisih?: number | null
          status?: string
          waktu_buka?: string
          waktu_tutup?: string | null
        }
        Update: {
          id?: string
          kas_fisik_akhir?: number | null
          kasir_id?: string
          modal_awal?: number
          selisih?: number | null
          status?: string
          waktu_buka?: string
          waktu_tutup?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_kasir_id_fkey"
            columns: ["kasir_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          alamat: string | null
          id: number
          logo_url: string | null
          nama_warung: string
        }
        Insert: {
          alamat?: string | null
          id?: number
          logo_url?: string | null
          nama_warung?: string
        }
        Update: {
          alamat?: string | null
          id?: number
          logo_url?: string | null
          nama_warung?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          created_at: string
          id: string
          nomor: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          nomor: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          nomor?: number
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role: { Args: Record<PropertyKey, never>; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]

// App-level convenience aliases
export type Role = "kasir" | "pemilik"
export type StatusMeja = "kosong" | "terisi"
export type StatusOrder = "terbuka" | "lunas"
export type StatusOrderItem = "aktif" | "dibatalkan"
export type MetodeBayar = "tunai" | "qris"
export type StatusShift = "buka" | "tutup"
