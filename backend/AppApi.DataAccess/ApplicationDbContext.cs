using AppApi.DataAccess.Repositories;
using AppApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace AppApi.DataAccess;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; } = null!;
    public virtual DbSet<Role> Roles { get; set; } = null!;
    public virtual DbSet<AccountRole> AccountRoles { get; set; } = null!;
    public virtual DbSet<ApiRoleMapping> ApiRoleMappings { get; set; } = null!;

    public virtual DbSet<Hall> Halls { get; set; } = null!;
    public virtual DbSet<HallElement> HallElements { get; set; } = null!;
    public virtual DbSet<AppEvent> Events { get; set; } = null!;
    public virtual DbSet<Attendee> Attendees { get; set; } = null!;
    public virtual DbSet<Assignment> Assignments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ================================================================
        // TABLE NAME MAPPINGS
        // Auth/Account tables: để EF dùng convention mặc định (Accounts, Roles…)
        // vì các bảng này được tạo bằng EF Migrations (PascalCase).
        // Domain tables: map rõ ràng sang snake_case theo database_sqlserver.sql
        // ================================================================
        modelBuilder.Entity<Hall>().ToTable("halls");
        modelBuilder.Entity<HallElement>().ToTable("hall_elements");
        modelBuilder.Entity<AppEvent>().ToTable("app_events");
        modelBuilder.Entity<Attendee>().ToTable("attendees");
        modelBuilder.Entity<Assignment>().ToTable("assignments");

        // ================================================================
        // COLUMN NAME MAPPINGS — domain tables (snake_case)
        // ================================================================

        // HallElement → hall_elements
        modelBuilder.Entity<HallElement>(e =>
        {
            e.Property(h => h.Id).HasColumnName("id");
            e.Property(h => h.HallId).HasColumnName("hall_id");
            e.Property(h => h.ElementType).HasColumnName("element_type");
            e.Property(h => h.X).HasColumnName("x").HasPrecision(18, 4);
            e.Property(h => h.Y).HasColumnName("y").HasPrecision(18, 4);
            e.Property(h => h.Width).HasColumnName("width").HasPrecision(18, 4);
            e.Property(h => h.Height).HasColumnName("height").HasPrecision(18, 4);
            e.Property(h => h.Rotation).HasColumnName("rotation").HasPrecision(18, 4);
            e.Property(h => h.Label).HasColumnName("label");
            e.Property(h => h.SeatType).HasColumnName("seat_type");
            e.Property(h => h.CreatedAt).HasColumnName("created_at");
        });

        // Hall → Halls (use EF migrations / DB naming)
        modelBuilder.Entity<Hall>(e =>
        {
            e.ToTable("Halls");
            e.Property(h => h.Id).HasColumnName("Id");
            e.Property(h => h.Name).HasColumnName("Name");
            e.Property(h => h.Description).HasColumnName("Description");
            e.Property(h => h.RowCount).HasColumnName("RowCount");
            e.Property(h => h.ColCount).HasColumnName("ColCount");
            e.Property(h => h.CreatedAt).HasColumnName("CreatedAt");
            e.Property(h => h.UpdatedAt).HasColumnName("UpdatedAt");
            // Map IsDeleted so inserts provide a value (DB column is non-nullable)
            e.Property(h => h.IsDeleted).HasColumnName("IsDeleted");
            // CreatedBy/UpdatedBy are nullable in the migration; keep as ignored or map if needed
            e.Ignore(h => h.CreatedBy);
            e.Ignore(h => h.UpdatedBy);
        });

        // AppEvent → app_events
        modelBuilder.Entity<AppEvent>(e =>
        {
            e.Property(ev => ev.Id).HasColumnName("id");
            e.Property(ev => ev.Name).HasColumnName("name");
            e.Property(ev => ev.Description).HasColumnName("description");
            e.Property(ev => ev.HallId).HasColumnName("hall_id");
            e.Property(ev => ev.EventDate).HasColumnName("event_date");
            e.Property(ev => ev.Status).HasColumnName("status");
            e.Property(ev => ev.CreatedAt).HasColumnName("created_at");
            e.Property(ev => ev.UpdatedAt).HasColumnName("updated_at");
            e.Ignore(ev => ev.IsDeleted);
            e.Ignore(ev => ev.CreatedBy);
            e.Ignore(ev => ev.UpdatedBy);
        });

        // Attendee → attendees
        modelBuilder.Entity<Attendee>(e =>
        {
            e.Property(a => a.Id).HasColumnName("id");
            e.Property(a => a.EventId).HasColumnName("event_id");
            e.Property(a => a.FullName).HasColumnName("full_name");
            e.Property(a => a.Title).HasColumnName("title");
            e.Property(a => a.Position).HasColumnName("position");
            e.Property(a => a.Degree).HasColumnName("degree");
            e.Property(a => a.Department).HasColumnName("department");
            e.Property(a => a.Phone).HasColumnName("phone");
            e.Property(a => a.Email).HasColumnName("email");
            e.Property(a => a.Notes).HasColumnName("notes");
            e.Property(a => a.Status).HasColumnName("status");
            e.Property(a => a.CreatedAt).HasColumnName("created_at");
            e.Ignore(a => a.IsDeleted);
            e.Ignore(a => a.UpdatedAt);
            e.Ignore(a => a.CreatedBy);
            e.Ignore(a => a.UpdatedBy);
        });

        // Assignment → assignments
        modelBuilder.Entity<Assignment>(e =>
        {
            e.Property(a => a.Id).HasColumnName("id");
            e.Property(a => a.EventId).HasColumnName("event_id");
            e.Property(a => a.ElementId).HasColumnName("element_id");
            e.Property(a => a.AttendeeId).HasColumnName("attendee_id");
            e.Property(a => a.Status).HasColumnName("status");
            e.Property(a => a.CreatedAt).HasColumnName("created_at");
            e.Ignore(a => a.IsDeleted);
            e.Ignore(a => a.UpdatedAt);
            e.Ignore(a => a.CreatedBy);
            e.Ignore(a => a.UpdatedBy);
        });

        // ================================================================
        // ACCOUNTROLE — composite PK (auth tables dùng EF convention)
        // ================================================================
        modelBuilder.Entity<AccountRole>()
            .HasKey(ar => new { ar.AccountId, ar.RoleId });

        modelBuilder.Entity<AccountRole>()
            .HasOne(ar => ar.Account)
            .WithMany(a => a.AccountRoles)
            .HasForeignKey(ar => ar.AccountId);

        modelBuilder.Entity<AccountRole>()
            .HasOne(ar => ar.Role)
            .WithMany(r => r.AccountRoles)
            .HasForeignKey(ar => ar.RoleId);

        // ================================================================
        // UNIQUE INDEXES
        // ================================================================
        modelBuilder.Entity<Account>()
            .HasIndex(a => a.Username).IsUnique();

        modelBuilder.Entity<Role>()
            .HasIndex(r => r.Name).IsUnique();

        modelBuilder.Entity<ApiRoleMapping>()
            .HasIndex(m => new { m.HttpMethod, m.EndpointPath, m.RoleId }).IsUnique();

        // ================================================================
        // FOREIGN KEYS & DELETE BEHAVIOR
        // ================================================================

        // HallElement → Hall
        modelBuilder.Entity<HallElement>()
            .HasOne(e => e.Hall)
            .WithMany(h => h.HallElements)
            .HasForeignKey(e => e.HallId)
            .OnDelete(DeleteBehavior.Cascade);

        // AppEvent → Hall
        modelBuilder.Entity<AppEvent>()
            .HasOne(e => e.Hall)
            .WithMany(h => h.Events)
            .HasForeignKey(e => e.HallId)
            .OnDelete(DeleteBehavior.Restrict);

        // Attendee → AppEvent
        modelBuilder.Entity<Attendee>()
            .HasOne(a => a.Event)
            .WithMany(e => e.Attendees)
            .HasForeignKey(a => a.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // Assignment → AppEvent
        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Event)
            .WithMany(e => e.Assignments)
            .HasForeignKey(a => a.EventId)
            .OnDelete(DeleteBehavior.Restrict);

        // Assignment → HallElement
        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Element)
            .WithMany(e => e.Assignments)
            .HasForeignKey(a => a.ElementId)
            .OnDelete(DeleteBehavior.Restrict);

        // Assignment → Attendee (nullable FK)
        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Attendee)
            .WithMany(att => att.Assignments)
            .HasForeignKey(a => a.AttendeeId)
            .OnDelete(DeleteBehavior.SetNull);

        // Unique: one attendee → one seat per event
        modelBuilder.Entity<Assignment>()
            .HasIndex(a => new { a.EventId, a.AttendeeId })
            .IsUnique()
            .HasFilter("[attendee_id] IS NOT NULL");
    }
}
