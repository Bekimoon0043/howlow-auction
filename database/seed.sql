-- Seed bid credit packages
INSERT INTO bid_credit_packages (name_am, name_en, credits, price_etb, sort_order) VALUES
  ('10 ክሬዲት', '10 Credits', 10, 50, 1),
  ('25 ክሬዲት', '25 Credits', 25, 100, 2),
  ('50 ክሬዲት', '50 Credits', 50, 180, 3),
  ('100 ክሬዲት', '100 Credits', 100, 300, 4),
  ('250 ክሬዲት', '250 Credits', 250, 700, 5),
  ('500 ክሬዲት', '500 Credits', 500, 1200, 6);

-- Sample category
INSERT INTO categories (name_am, name_en, slug) VALUES
  ('ኤሌክትሮኒክስ', 'Electronics', 'electronics'),
  ('የቤት እቃዎች', 'Home', 'home'),
  ('ፋሽን', 'Fashion', 'fashion');
