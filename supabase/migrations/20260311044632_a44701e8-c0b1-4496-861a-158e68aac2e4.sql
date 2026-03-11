
-- Fix: restrict notification creation to admins and the system, plus self-notifications
DROP POLICY "Authenticated can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer')
);
