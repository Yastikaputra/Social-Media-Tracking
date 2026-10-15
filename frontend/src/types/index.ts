export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  tracking_tasks_count?: number;
  created_at?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  monthly_lead_target: number;
  total_leads?: number;
  total_reach?: number;
  tracking_tasks_count?: number;
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  total_leads?: number;
  tracking_tasks_count?: number;
}

export interface TrackingTask {
  id: number;
  user_id: number;
  pic_name?: string | null;
  brand_id: number;
  platform_id: number;
  task_date: string;
  title: string;
  content_type: string;
  link_url?: string | null;
  screenshot_path?: string | null;
  screenshot_url?: string | null;
  leads_count: number;
  reach_count: number;
  engagement_count: number;
  notes?: string | null;
  follow_up?: string | null;
  status: 'completed' | 'in_progress' | 'reviewed';
  created_at?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  brand?: Brand;
  platform?: Platform;
}

export interface PlatformStat {
  platform_id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
  total_tasks: number;
  total_leads: number;
  total_reach: number;
  total_engagement: number;
}

export interface DashboardAnalytics {
  summary: {
    total_leads: number;
    total_reach: number;
    total_engagement: number;
    total_tasks: number;
    conversion_rate: number;
    top_platform?: {
      name: string;
      slug: string;
      leads: number;
      percentage: number;
      color: string;
    };
    top_brand?: {
      name: string;
      slug: string;
      leads: number;
      achievement_pct: number;
      color: string;
    };
  };
  leads_by_platform: Array<{
    platform_id: number;
    name: string;
    slug: string;
    color: string;
    icon: string;
    leads: number;
    reach: number;
    tasks_count: number;
    percentage: number;
  }>;
  leads_by_brand: Array<{
    brand_id: number;
    name: string;
    slug: string;
    color: string;
    leads: number;
    reach: number;
    tasks_count: number;
    target: number;
    achievement_pct: number;
  }>;
  brand_platform_matrix: Array<Record<string, any>>;
  leads_trend: Array<{
    date: string;
    formatted_date: string;
    total_leads: number;
    instagram?: number;
    facebook?: number;
    threads?: number;
    whatsapp?: number;
  }>;
  recent_tasks: TrackingTask[];
  selected_brand?: Brand | null;
}
