/* ============================================================================
   SEATMAPDB
   HỆ THỐNG QUẢN LÝ SƠ ĐỒ CHỖ NGỒI / SEAT DESIGNER
   SQL SERVER - T-SQL

   Phiên bản:
   - Không sử dụng ON DELETE CASCADE
   - Không sử dụng ON UPDATE CASCADE
   - Tránh hoàn toàn lỗi SQL Server Msg 1785
   - Có đầy đủ PK / FK / UNIQUE / CHECK / INDEX
   ============================================================================ */


/* ============================================================================
   1. TẠO DATABASE
   ============================================================================ */

IF DB_ID(N'SeatMapDB') IS NULL
BEGIN
    CREATE DATABASE SeatMapDB;
END
GO


USE SeatMapDB;
GO

/* ============================================================================
   1. USERS
   Tài khoản người dùng hệ thống
   ============================================================================ */

IF OBJECT_ID(N'dbo.refresh_tokens', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.refresh_tokens;
END
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.users;
END
GO


CREATE TABLE dbo.users
(
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_users
        PRIMARY KEY
        DEFAULT NEWID(),

    username NVARCHAR(100) NOT NULL,

    password_hash NVARCHAR(500) NOT NULL,

    full_name NVARCHAR(255) NOT NULL,

    email NVARCHAR(255) NULL,

    phone NVARCHAR(50) NULL,

    role NVARCHAR(50) NOT NULL
        CONSTRAINT DF_users_role
        DEFAULT N'user',

    status NVARCHAR(50) NOT NULL
        CONSTRAINT DF_users_status
        DEFAULT N'active',

    last_login_at DATETIME2(0) NULL,

    created_at DATETIME2(0) NOT NULL
        CONSTRAINT DF_users_created_at
        DEFAULT GETDATE(),

    updated_at DATETIME2(0) NOT NULL
        CONSTRAINT DF_users_updated_at
        DEFAULT GETDATE(),

    CONSTRAINT UQ_users_username
        UNIQUE (username),

    CONSTRAINT CK_users_role
        CHECK
        (
            role IN
            (
                N'admin',
                N'organizer',
                N'user'
            )
        ),

    CONSTRAINT CK_users_status
        CHECK
        (
            status IN
            (
                N'active',
                N'locked',
                N'inactive'
            )
        )
);
GO


/* ============================================================================
   2. REFRESH TOKENS
   Lưu phiên đăng nhập / refresh token
   ============================================================================ */

CREATE TABLE dbo.refresh_tokens
(
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_refresh_tokens
        PRIMARY KEY
        DEFAULT NEWID(),

    user_id UNIQUEIDENTIFIER NOT NULL,

    /*
       Không lưu refresh token thật.
       Chỉ lưu SHA-256 hash của refresh token.
    */
    token_hash VARCHAR(128) NOT NULL,

    expires_at DATETIME2(0) NOT NULL,

    created_at DATETIME2(0) NOT NULL
        CONSTRAINT DF_refresh_tokens_created_at
        DEFAULT GETDATE(),

    revoked_at DATETIME2(0) NULL,

    replaced_by_token_id UNIQUEIDENTIFIER NULL,

    created_ip VARCHAR(45) NULL,

    user_agent NVARCHAR(1000) NULL,

    CONSTRAINT FK_refresh_tokens_users
        FOREIGN KEY (user_id)
        REFERENCES dbo.users(id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,

    CONSTRAINT UQ_refresh_tokens_token_hash
        UNIQUE (token_hash)
);
GO


/* ============================================================================
   3. INDEX USERS
   ============================================================================ */

CREATE INDEX IX_users_status
ON dbo.users(status);
GO


CREATE INDEX IX_users_email
ON dbo.users(email);
GO


/* ============================================================================
   4. INDEX REFRESH TOKENS
   ============================================================================ */

CREATE INDEX IX_refresh_tokens_user_id
ON dbo.refresh_tokens(user_id);
GO


CREATE INDEX IX_refresh_tokens_expires_at
ON dbo.refresh_tokens(expires_at);
GO


CREATE INDEX IX_refresh_tokens_revoked_at
ON dbo.refresh_tokens(revoked_at);
GO

/* ============================================================================
   2. XÓA FOREIGN KEY CŨ
   ============================================================================ */

IF OBJECT_ID(N'dbo.FK_assignments_attendees', N'F') IS NOT NULL
BEGIN
    ALTER TABLE dbo.assignments
    DROP CONSTRAINT FK_assignments_attendees;
END
GO

IF OBJECT_ID(N'dbo.FK_assignments_hall_elements', N'F') IS NOT NULL
BEGIN
    ALTER TABLE dbo.assignments
    DROP CONSTRAINT FK_assignments_hall_elements;
END
GO

IF OBJECT_ID(N'dbo.FK_assignments_events', N'F') IS NOT NULL
BEGIN
    ALTER TABLE dbo.assignments
    DROP CONSTRAINT FK_assignments_events;
END
GO

IF OBJECT_ID(N'dbo.FK_attendees_events', N'F') IS NOT NULL
BEGIN
    ALTER TABLE dbo.attendees
    DROP CONSTRAINT FK_attendees_events;
END
GO

IF OBJECT_ID(N'dbo.FK_events_halls', N'F') IS NOT NULL
BEGIN
    ALTER TABLE dbo.events
    DROP CONSTRAINT FK_events_halls;
END
GO

IF OBJECT_ID(N'dbo.FK_hall_elements_halls', N'F') IS NOT NULL
BEGIN
    ALTER TABLE dbo.hall_elements
    DROP CONSTRAINT FK_hall_elements_halls;
END
GO


/* ============================================================================
   3. XÓA BẢNG CŨ
   Thứ tự: bảng con -> bảng cha
   ============================================================================ */

IF OBJECT_ID(N'dbo.assignments', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.assignments;
END
GO

IF OBJECT_ID(N'dbo.attendees', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.attendees;
END
GO

IF OBJECT_ID(N'dbo.events', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.events;
END
GO

IF OBJECT_ID(N'dbo.hall_elements', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.hall_elements;
END
GO

IF OBJECT_ID(N'dbo.halls', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.halls;
END
GO


/* ============================================================================
   4. BẢNG HALLS
   Hội trường / Sơ đồ khán phòng
   ============================================================================ */
CREATE TABLE halls (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255),
    description NVARCHAR(MAX),
    row_count INT,
    col_count INT,
    created_at DATETIME2,
    updated_at DATETIME2
);


CREATE TABLE hall_elements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    hall_id UNIQUEIDENTIFIER,
    element_type NVARCHAR(50),
    x DECIMAL(18,2),
    y DECIMAL(18,2),
    width DECIMAL(18,2),
    height DECIMAL(18,2),
    rotation DECIMAL(18,2),
    label NVARCHAR(255),
    seat_type NVARCHAR(50),
    created_at DATETIME2
);


CREATE TABLE app_events (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255),
    description NVARCHAR(MAX),
    hall_id UNIQUEIDENTIFIER,
    event_date DATETIME2,
    status NVARCHAR(50),
    created_at DATETIME2,
    updated_at DATETIME2
);


CREATE TABLE attendees (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    event_id UNIQUEIDENTIFIER,
    full_name NVARCHAR(255),
    department NVARCHAR(255),
    phone NVARCHAR(50),
    email NVARCHAR(255),
    notes NVARCHAR(MAX),
    status NVARCHAR(50),
    title NVARCHAR(255),
    position NVARCHAR(255),
    degree NVARCHAR(100),
    created_at DATETIME2
);


CREATE TABLE assignments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    event_id UNIQUEIDENTIFIER,
    element_id UNIQUEIDENTIFIER,
    attendee_id UNIQUEIDENTIFIER,
    status NVARCHAR(50),
    created_at DATETIME2
);
GO


/* ============================================================================
   9. INDEX - HALL_ELEMENTS
   ============================================================================ */

CREATE INDEX IX_hall_elements_hall_id
ON dbo.hall_elements(hall_id);
GO


/* ============================================================================
   10. INDEX - EVENTS
   ============================================================================ */

CREATE INDEX IX_events_hall_id
ON dbo.events(hall_id);
GO

CREATE INDEX IX_events_event_date
ON dbo.events(event_date);
GO

CREATE INDEX IX_events_status
ON dbo.events(status);
GO


/* ============================================================================
   11. INDEX - ATTENDEES
   ============================================================================ */

CREATE INDEX IX_attendees_event_id
ON dbo.attendees(event_id);
GO

CREATE INDEX IX_attendees_status
ON dbo.attendees(status);
GO


/* ============================================================================
   12. INDEX - ASSIGNMENTS
   ============================================================================ */

CREATE INDEX IX_assignments_event_id
ON dbo.assignments(event_id);
GO

CREATE INDEX IX_assignments_element_id
ON dbo.assignments(element_id);
GO

CREATE INDEX IX_assignments_attendee_id
ON dbo.assignments(attendee_id);
GO


/* ============================================================================
   13. ĐẢM BẢO MỘT NGƯỜI CHỈ CÓ MỘT GHẾ TRONG MỘT EVENT
   ============================================================================ */

CREATE UNIQUE INDEX UX_assignments_event_attendee
ON dbo.assignments(event_id, attendee_id)
WHERE attendee_id IS NOT NULL;
GO


/* ============================================================================
   14. KIỂM TRA CÁC BẢNG ĐÃ TẠO
   ============================================================================ */

SELECT
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = N'dbo'
  AND TABLE_NAME IN
  (
      N'halls',
      N'hall_elements',
      N'events',
      N'attendees',
      N'assignments'
  )
ORDER BY TABLE_NAME;
GO


/* ============================================================================
   15. KIỂM TRA FOREIGN KEY
   ============================================================================ */

SELECT
    fk.name AS foreign_key_name,
    OBJECT_NAME(fk.parent_object_id) AS child_table,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS child_column,
    OBJECT_NAME(fk.referenced_object_id) AS parent_table,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS parent_column,
    fk.delete_referential_action_desc AS delete_action,
    fk.update_referential_action_desc AS update_action
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc
    ON fk.object_id = fkc.constraint_object_id
WHERE fk.parent_object_id IN
(
    OBJECT_ID(N'dbo.hall_elements'),
    OBJECT_ID(N'dbo.events'),
    OBJECT_ID(N'dbo.attendees'),
    OBJECT_ID(N'dbo.assignments')
)
ORDER BY child_table, foreign_key_name;
GO
/* ============================================================================
   Khóa ngoại 
   ============================================================================ */

-- 1. app_events → halls
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_app_events_halls'
)
BEGIN
    ALTER TABLE app_events
    ADD CONSTRAINT FK_app_events_halls
    FOREIGN KEY (hall_id)
    REFERENCES halls(id);
END;


-- 2. attendees → app_events
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_attendees_app_events'
)
BEGIN
    ALTER TABLE attendees
    ADD CONSTRAINT FK_attendees_app_events
    FOREIGN KEY (event_id)
    REFERENCES app_events(id);
END;


-- 3. assignments → app_events
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_assignments_app_events'
)
BEGIN
    ALTER TABLE assignments
    ADD CONSTRAINT FK_assignments_app_events
    FOREIGN KEY (event_id)
    REFERENCES app_events(id);
END;


-- 4. assignments → hall_elements
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_assignments_hall_elements'
)
BEGIN
    ALTER TABLE assignments
    ADD CONSTRAINT FK_assignments_hall_elements
    FOREIGN KEY (element_id)
    REFERENCES hall_elements(id);
END;


-- 5. assignments → attendees
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_assignments_attendees'
)
BEGIN
    ALTER TABLE assignments
    ADD CONSTRAINT FK_assignments_attendees
    FOREIGN KEY (attendee_id)
    REFERENCES attendees(id);
END;


-- 6. refresh_tokens → users
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_refresh_tokens_users'
)
BEGIN
    ALTER TABLE refresh_tokens
    ADD CONSTRAINT FK_refresh_tokens_users
    FOREIGN KEY (user_id)
    REFERENCES users(id);
END;

/* ============================================================================
   KẾT THÚC
   ============================================================================ */