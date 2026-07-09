-- =============================================================
-- Bus-Unternehmen-Manager – Städteausbau
-- Flächendeckendes Netz: ~65 Städte in DE/AT/CH, damit Linien
-- in nahezu jede größere Stadt möglich sind
-- =============================================================

insert into public.cities (id, name, population, lat, lng, region) values
  -- Deutschland
  ('dortmund',     'Dortmund',      590000, 51.5136,  7.4653, 'de'),
  ('essen',        'Essen',         580000, 51.4556,  7.0116, 'de'),
  ('duisburg',     'Duisburg',      500000, 51.4344,  6.7623, 'de'),
  ('bochum',       'Bochum',        365000, 51.4818,  7.2162, 'de'),
  ('wuppertal',    'Wuppertal',     355000, 51.2562,  7.1508, 'de'),
  ('bielefeld',    'Bielefeld',     335000, 52.0302,  8.5325, 'de'),
  ('bonn',         'Bonn',          330000, 50.7374,  7.0982, 'de'),
  ('muenster',     'Münster',       320000, 51.9607,  7.6261, 'de'),
  ('mannheim',     'Mannheim',      310000, 49.4875,  8.4660, 'de'),
  ('karlsruhe',    'Karlsruhe',     310000, 49.0069,  8.4037, 'de'),
  ('augsburg',     'Augsburg',      300000, 48.3705, 10.8978, 'de'),
  ('aachen',       'Aachen',        250000, 50.7753,  6.0839, 'de'),
  ('braunschweig', 'Braunschweig',  250000, 52.2689, 10.5268, 'de'),
  ('kiel',         'Kiel',          246000, 54.3233, 10.1228, 'de'),
  ('chemnitz',     'Chemnitz',      245000, 50.8278, 12.9214, 'de'),
  ('halle',        'Halle (Saale)', 240000, 51.4970, 11.9688, 'de'),
  ('magdeburg',    'Magdeburg',     240000, 52.1205, 11.6276, 'de'),
  ('freiburg',     'Freiburg',      230000, 47.9990,  7.8421, 'de'),
  ('mainz',        'Mainz',         220000, 49.9929,  8.2473, 'de'),
  ('luebeck',      'Lübeck',        216000, 53.8655, 10.6866, 'de'),
  ('erfurt',       'Erfurt',        214000, 50.9848, 11.0299, 'de'),
  ('rostock',      'Rostock',       210000, 54.0924, 12.0991, 'de'),
  ('kassel',       'Kassel',        200000, 51.3127,  9.4797, 'de'),
  ('potsdam',      'Potsdam',       185000, 52.3906, 13.0645, 'de'),
  ('saarbruecken', 'Saarbrücken',   180000, 49.2402,  6.9969, 'de'),
  ('oldenburg',    'Oldenburg',     170000, 53.1435,  8.2146, 'de'),
  ('osnabrueck',   'Osnabrück',     165000, 52.2799,  8.0472, 'de'),
  ('heidelberg',   'Heidelberg',    160000, 49.3988,  8.6724, 'de'),
  ('regensburg',   'Regensburg',    155000, 49.0134, 12.1016, 'de'),
  ('ingolstadt',   'Ingolstadt',    140000, 48.7665, 11.4258, 'de'),
  ('wuerzburg',    'Würzburg',      128000, 49.7913,  9.9534, 'de'),
  ('ulm',          'Ulm',           126000, 48.4011,  9.9876, 'de'),
  ('goettingen',   'Göttingen',     118000, 51.5413,  9.9158, 'de'),
  ('koblenz',      'Koblenz',       115000, 50.3569,  7.5890, 'de'),
  ('trier',        'Trier',         111000, 49.7596,  6.6441, 'de'),
  ('jena',         'Jena',          111000, 50.9271, 11.5892, 'de'),
  ('cottbus',      'Cottbus',       100000, 51.7563, 14.3329, 'de'),
  -- Österreich
  ('klagenfurt',   'Klagenfurt',    105000, 46.6249, 14.3053, 'at'),
  -- Schweiz
  ('lausanne',     'Lausanne',      140000, 46.5197,  6.6323, 'ch'),
  ('winterthur',   'Winterthur',    115000, 47.5008,  8.7241, 'ch'),
  ('luzern',       'Luzern',         82000, 47.0502,  8.3093, 'ch'),
  ('stgallen',     'St. Gallen',     76000, 47.4245,  9.3767, 'ch'),
  ('lugano',       'Lugano',         62000, 46.0037,  8.9511, 'ch');
