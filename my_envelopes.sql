create table my_envelopes (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY ,
  name varchar(30) NOT NULL,
  envelope_limit INT NOT NULL,
  transfer_amount INT NOT NULL
);

INSERT INTO my_envelopes (name, envelope_limit, transfer_amount)
VALUES ('Total', 2000, 2000);