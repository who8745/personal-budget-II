create table my_envelopes (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY ,
  name varchar(30) NOT NULL,
  envelope_limit INT NOT NULL,
  transfer_amount INT NOT NULL
);

create table transactions (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY ,
  recipient varchar(30) NOT NULL,
  payment_amount INT NOT NULL,
  date_sent Date NOT NULL,
  envelope_id INT NOT NULL,
  constraint fk_env_id
    foreign key (envelope_id)
    references my_envelopes (id)
);

INSERT INTO my_envelopes (name, envelope_limit, transfer_amount)
VALUES ('Total', 2000, 2000);