import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealStats {
  totalFiles: number;
  totalUsers: number;
  totalDownloads: number;
  totalConverts: number;
}

export const useRealStats = () => {
  const [stats, setStats] = useState<RealStats>({
    totalFiles: 0,
    totalUsers: 1,
    totalDownloads: 0,
    totalConverts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total files count
        const { count: filesCount } = await supabase
          .from('files')
          .select('*', { count: 'exact', head: true });

        // Fetch total downloads
        const { data: filesData } = await supabase
          .from('files')
          .select('download_count');
        
        const totalDownloads = filesData?.reduce((sum, file) => sum + (file.download_count || 0), 0) || 0;

        // Fetch total conversions
        const { count: conversionsCount } = await supabase
          .from('conversions')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalFiles: filesCount || 0,
          totalUsers: 1, // You can update this based on your user tracking logic
          totalDownloads,
          totalConverts: conversionsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};
