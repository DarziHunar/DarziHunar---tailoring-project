--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg110+2)
-- Dumped by pg_dump version 16.4 (Debian 16.4-1.pgdg110+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO postgres;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO postgres;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'CUSTOMER',
    'TAILOR',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Tailor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tailor" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "shopName" text NOT NULL,
    bio text,
    categories text[],
    location public.geography(Point,4326) NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    rating double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Tailor" OWNER TO postgres;

--
-- Name: Tailor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Tailor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Tailor_id_seq" OWNER TO postgres;

--
-- Name: Tailor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Tailor_id_seq" OWNED BY public."Tailor".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."Role" DEFAULT 'CUSTOMER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Tailor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tailor" ALTER COLUMN id SET DEFAULT nextval('public."Tailor_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Tailor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tailor" (id, "userId", "shopName", bio, categories, location, verified, rating, "createdAt", "updatedAt") FROM stdin;
1	1	Royal Stitch Tailors	Premium custom tailoring for traditional and modern outfits.	{Men,Sherwani,Kurta,Suits}	0101000020E6100000C0EC9E3C2C385240FA7E6ABC74133340	t	4.8	2026-09-09 14:10:05.21	2026-09-09 14:10:05.21
2	2	Elegant Threads	Specialists in bridal and ethnic custom clothing.	{Women,Bridal,Lehenga,"Saree Blouse"}	0101000020E61000003255302AA93752405BD3BCE3141D3340	t	4.7	2026-09-09 14:10:05.267	2026-09-09 14:10:05.267
3	3	Perfect Fit Tailors	Professional menswear tailoring with modern fitting.	{Men,Shirts,Trousers,Suits}	0101000020E610000096438B6CE74352406ADE718A8E043340	t	4.6	2026-09-09 14:10:05.269	2026-09-09 14:10:05.269
4	4	Needle & Thread Studio	Custom fashion and alterations for every occasion.	{Women,Dresses,Alterations}	0101000020E6100000EC51B81E8547524093A9825149FD3240	f	4.3	2026-09-09 14:10:05.271	2026-09-09 14:10:05.271
5	5	Classic Cuts	Traditional tailoring with a modern touch.	{Men,Kurta,Pathani,Alterations}	0101000020E6100000ED0DBE30993E524080B74082E2373340	t	4.5	2026-09-09 14:10:05.274	2026-09-09 14:10:05.274
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", role, "createdAt", "updatedAt") FROM stdin;
1	tailor1@darzihunar.com	$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz123456	TAILOR	2026-09-09 14:10:05.118	2026-09-09 14:10:05.118
2	tailor2@darzihunar.com	$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz123456	TAILOR	2026-09-09 14:10:05.288	2026-09-09 14:10:05.288
3	tailor3@darzihunar.com	$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz123456	TAILOR	2026-09-09 14:10:05.291	2026-09-09 14:10:05.291
4	tailor4@darzihunar.com	$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz123456	TAILOR	2026-09-09 14:10:05.293	2026-09-09 14:10:05.293
5	tailor5@darzihunar.com	$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz123456	TAILOR	2026-09-09 14:10:05.295	2026-09-09 14:10:05.295
6	ruhaan@gmail.com	$2b$12$SrMx5ptnQIFnAo4GRY/okeC/EDAIK60/8YZivA7bP7yeDysC2zdwW	CUSTOMER	2026-09-14 10:22:58.865	2026-09-14 10:22:58.865
7	sahil@gmail.com	$2b$12$np763hKyX7lx370AFVEzuuUt4h2e7SvEpgXaEAHxrAkDoFHKRqFA.	CUSTOMER	2026-09-14 10:24:12.907	2026-09-14 10:24:12.907
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
808787e9-c07a-4594-a51f-0a0a9180d801	8289598ccdc251bd38b36f123fa01736a7f11d6acc21f05b2af9df2fcf935a23	2026-09-08 16:57:12.387538+00	20260908165638_init_phase1	\N	\N	2026-09-08 16:57:12.012297+00	1
ded954ad-abdc-483e-bd41-478465e66160	0e00ae2a69c0c22516205c7eaa360eba711a951ee8f58a45b3cb89d7260b9dd6	2026-09-08 16:57:50.954442+00	20260908165750_init_phase1	\N	\N	2026-09-08 16:57:50.940989+00	1
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Name: Tailor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Tailor_id_seq"', 5, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 7, true);


--
-- Name: Tailor Tailor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tailor"
    ADD CONSTRAINT "Tailor_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Tailor_location_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Tailor_location_idx" ON public."Tailor" USING gist (location);


--
-- Name: Tailor_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Tailor_userId_key" ON public."Tailor" USING btree ("userId");


--
-- Name: Tailor_verified_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Tailor_verified_idx" ON public."Tailor" USING btree (verified);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Tailor Tailor_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tailor"
    ADD CONSTRAINT "Tailor_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

