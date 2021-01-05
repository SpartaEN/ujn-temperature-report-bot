create table tasks
(
	uid varchar(64) not null,
	openid varchar(64) not null,
	constraint openid_UNIQUE
		unique (openid)
);