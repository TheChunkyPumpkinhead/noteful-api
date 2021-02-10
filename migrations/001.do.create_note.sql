CREATE TABLE noteful_notes (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  date_published TIMESTAMP DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  content TEXT
);