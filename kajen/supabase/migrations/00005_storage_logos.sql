-- Public bucket for tenant logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read logos (public bucket, but explicit policy for clarity)
CREATE POLICY "Public read logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Admins, staff and super_admins can upload
CREATE POLICY "Admin upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND
    current_user_role() IN ('admin', 'staff', 'super_admin')
  );

-- Admins can replace/delete their logo
CREATE POLICY "Admin delete logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND
    current_user_role() IN ('admin', 'staff', 'super_admin')
  );

CREATE POLICY "Admin update logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND
    current_user_role() IN ('admin', 'staff', 'super_admin')
  );
