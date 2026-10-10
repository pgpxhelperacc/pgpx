-- Seed data for PGPx Student Portal (IIM Rohtak)

-- Faculty
INSERT INTO public.faculty (id, name, email, department) VALUES
('11111111-1111-1111-1111-111111111101', 'Prof. K. Mukherjee', 'kmukherjee@iimrohtak.ac.in', 'Strategic Management'),
('11111111-1111-1111-1111-111111111102', 'Prof. R. Sharma', 'rsharma@iimrohtak.ac.in', 'Finance & Accounting'),
('11111111-1111-1111-1111-111111111103', 'Prof. A. Verma', 'averma@iimrohtak.ac.in', 'Operations & Supply Chain'),
('11111111-1111-1111-1111-111111111104', 'Prof. P. Gupta', 'pgupta@iimrohtak.ac.in', 'Marketing Management'),
('11111111-1111-1111-1111-111111111105', 'Prof. S. Sen', 'ssen@iimrohtak.ac.in', 'Organizational Behaviour')
ON CONFLICT (id) DO NOTHING;

-- Courses
INSERT INTO public.courses (id, code, name, term, credits) VALUES
('22222222-2222-2222-2222-222222222201', 'STRAT-601', 'Strategic Management & Global Execution', 'Term 4', 3.0),
('22222222-2222-2222-2222-222222222202', 'FIN-602', 'Corporate Valuation & M&A', 'Term 4', 3.0),
('22222222-2222-2222-2222-222222222203', 'OPS-603', 'Supply Chain Analytics & Optimization', 'Term 4', 3.0),
('22222222-2222-2222-2222-222222222204', 'MKT-604', 'Digital Marketing & Growth Engines', 'Term 4', 3.0),
('22222222-2222-2222-2222-222222222205', 'LEAD-605', 'Executive Leadership & Influence', 'Term 4', 2.0)
ON CONFLICT (id) DO NOTHING;

-- Course-Faculty linking
INSERT INTO public.course_faculty (course_id, faculty_id) VALUES
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101'),
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102'),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103'),
('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111104'),
('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111105')
ON CONFLICT DO NOTHING;

-- Allowlist for PGPx06 Batch
INSERT INTO public.allowlist (email, roll_no, name, role) VALUES
('rahul.v24@iimrohtak.ac.in', 'PGPX06012', 'Rahul Verma', 'student'),
('ananya.s24@iimrohtak.ac.in', 'PGPX06005', 'Ananya Sharma', 'cr'),
('pgpx.admin@iimrohtak.ac.in', 'ADMIN001', 'PGPx Academic Office', 'admin'),
('rohan.d24@iimrohtak.ac.in', 'PGPX06045', 'Rohan Desai', 'student'),
('priya.p24@iimrohtak.ac.in', 'PGPX06031', 'Priya Patel', 'student'),
('vikram.m24@iimrohtak.ac.in', 'PGPX06018', 'Vikram Malhotra', 'student'),
('sneha.r24@iimrohtak.ac.in', 'PGPX06029', 'Sneha Roy', 'student')
ON CONFLICT (email) DO NOTHING;

-- Default Chat Room
INSERT INTO public.chat_rooms (id, name, is_active) VALUES
('33333333-3333-3333-3333-333333333301', 'PGPx Batch Lounge', true)
ON CONFLICT (id) DO NOTHING;

-- Semester Calendar
INSERT INTO public.semester_calendar (term, label, kind, start_date, end_date, notes) VALUES
('Term 4', 'Term 4 Classes Begin', 'term_boundary', '2026-09-01', '2026-09-01', 'Welcome back session at Auditorium 1'),
('Term 4', 'Dussehra Break', 'holiday', '2026-10-20', '2026-10-22', 'Institute holiday, no classes'),
('Term 4', 'Mid-Term Examinations', 'exam_window', '2026-10-26', '2026-10-30', 'Slot timings: 09:30 - 12:30'),
('Term 4', 'Live Industry Project Week', 'project_week', '2026-11-09', '2026-11-15', 'No on-campus lectures; client presentations'),
('Term 4', 'Diwali Recess', 'break', '2026-11-16', '2026-11-20', 'Campus closed for Diwali festivities'),
('Term 4', 'End-Term Examination Window', 'exam_window', '2026-12-14', '2026-12-19', 'Graduation audit begins thereafter')
ON CONFLICT DO NOTHING;
