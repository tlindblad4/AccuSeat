-- AccuSeat Admin Setup
-- Run this AFTER running schema.sql and creating your first venue

-- First, create a venue (required for foreign key)
INSERT INTO venues (name, slug, location, description, total_seats)
VALUES (
  'Demo Venue', 
  'demo-venue', 
  'Demo Location', 
  'Initial venue for setup', 
  1000
)
RETURNING id;

-- Then create admin user (replace USER_ID with your actual user ID from auth.users)
-- Get your user ID from: Auth → Users → copy the UUID
INSERT INTO user_venues (user_id, venue_id, role) 
SELECT 
  'YOUR_USER_ID_HERE',  -- Replace this!
  id, 
  'admin'
FROM venues 
WHERE slug = 'demo-venue';
