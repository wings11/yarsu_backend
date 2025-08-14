import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Get analytics statistics
router.get('/', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Admin client for backend operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get counts for all content types
    const [
      jobsResult,
      hotelsResult,
      restaurantsResult,
      condosResult,
      travelResult,
      coursesResult,
      generalResult,
      docsResult,
      linksResult,
      highlightsResult,
      usersResult,
      chatsResult
    ] = await Promise.all([
      supabaseAdmin.from('jobs').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('hotels').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('restaurants').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('condos').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('travel_posts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('general_posts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('docs').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('links').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('highlights').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('chats').select('id', { count: 'exact', head: true })
    ]);

    // Calculate totals
    const stats = {
      totalUsers: usersResult.count || 0,
      totalPosts: (jobsResult.count || 0) + 
                  (hotelsResult.count || 0) + 
                  (restaurantsResult.count || 0) + 
                  (condosResult.count || 0) + 
                  (travelResult.count || 0) + 
                  (coursesResult.count || 0) + 
                  (generalResult.count || 0) + 
                  (docsResult.count || 0) + 
                  (linksResult.count || 0),
      activeChats: chatsResult.count || 0,
      highlights: highlightsResult.count || 0,
      categories: {
        jobs: jobsResult.count || 0,
        hotels: hotelsResult.count || 0,
        restaurants: restaurantsResult.count || 0,
        condos: condosResult.count || 0,
        travel: travelResult.count || 0,
        courses: coursesResult.count || 0,
        general: generalResult.count || 0,
        docs: docsResult.count || 0,
        links: linksResult.count || 0,
        highlights: highlightsResult.count || 0
      }
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      details: error.message 
    });
  }
});

export default router;
