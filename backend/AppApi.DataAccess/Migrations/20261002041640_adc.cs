using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppApi.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class adc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Attendees_AttendeeId",
                table: "Assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Events_EventId",
                table: "Assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Seats_SeatId",
                table: "Assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_Attendees_Events_EventId",
                table: "Attendees");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropTable(
                name: "Seats");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Attendees",
                table: "Attendees");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Assignments",
                table: "Assignments");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_EventId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Halls");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Halls");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Attendees");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Attendees");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Assignments");

            migrationBuilder.RenameTable(
                name: "Attendees",
                newName: "attendees");

            migrationBuilder.RenameTable(
                name: "Assignments",
                newName: "assignments");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "attendees",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "attendees",
                newName: "phone");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "attendees",
                newName: "notes");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "attendees",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Department",
                table: "attendees",
                newName: "department");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "attendees",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "attendees",
                newName: "full_name");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "attendees",
                newName: "event_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "attendees",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "UpdatedBy",
                table: "attendees",
                newName: "title");

            migrationBuilder.RenameColumn(
                name: "CreatedBy",
                table: "attendees",
                newName: "position");

            migrationBuilder.RenameIndex(
                name: "IX_Attendees_EventId",
                table: "attendees",
                newName: "IX_attendees_event_id");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "assignments",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "assignments",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "assignments",
                newName: "event_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "assignments",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "AttendeeId",
                table: "assignments",
                newName: "attendee_id");

            migrationBuilder.RenameColumn(
                name: "SeatId",
                table: "assignments",
                newName: "element_id");

            migrationBuilder.RenameIndex(
                name: "IX_Assignments_SeatId",
                table: "assignments",
                newName: "IX_assignments_element_id");

            migrationBuilder.RenameIndex(
                name: "IX_Assignments_AttendeeId",
                table: "assignments",
                newName: "IX_assignments_attendee_id");

            migrationBuilder.AddColumn<string>(
                name: "degree",
                table: "attendees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_attendees",
                table: "attendees",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_assignments",
                table: "assignments",
                column: "id");

            migrationBuilder.CreateTable(
                name: "app_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    hall_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    event_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_events", x => x.id);
                    table.ForeignKey(
                        name: "FK_app_events_Halls_hall_id",
                        column: x => x.hall_id,
                        principalTable: "Halls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "hall_elements",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    hall_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    element_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    x = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    y = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    width = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    height = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    rotation = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    label = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    seat_type = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hall_elements", x => x.id);
                    table.ForeignKey(
                        name: "FK_hall_elements_Halls_hall_id",
                        column: x => x.hall_id,
                        principalTable: "Halls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_assignments_event_id_attendee_id",
                table: "assignments",
                columns: new[] { "event_id", "attendee_id" },
                unique: true,
                filter: "[attendee_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_app_events_hall_id",
                table: "app_events",
                column: "hall_id");

            migrationBuilder.CreateIndex(
                name: "IX_hall_elements_hall_id",
                table: "hall_elements",
                column: "hall_id");

            migrationBuilder.AddForeignKey(
                name: "FK_assignments_app_events_event_id",
                table: "assignments",
                column: "event_id",
                principalTable: "app_events",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_assignments_attendees_attendee_id",
                table: "assignments",
                column: "attendee_id",
                principalTable: "attendees",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_assignments_hall_elements_element_id",
                table: "assignments",
                column: "element_id",
                principalTable: "hall_elements",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_attendees_app_events_event_id",
                table: "attendees",
                column: "event_id",
                principalTable: "app_events",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_assignments_app_events_event_id",
                table: "assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_assignments_attendees_attendee_id",
                table: "assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_assignments_hall_elements_element_id",
                table: "assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_attendees_app_events_event_id",
                table: "attendees");

            migrationBuilder.DropTable(
                name: "app_events");

            migrationBuilder.DropTable(
                name: "hall_elements");

            migrationBuilder.DropPrimaryKey(
                name: "PK_attendees",
                table: "attendees");

            migrationBuilder.DropPrimaryKey(
                name: "PK_assignments",
                table: "assignments");

            migrationBuilder.DropIndex(
                name: "IX_assignments_event_id_attendee_id",
                table: "assignments");

            migrationBuilder.DropColumn(
                name: "degree",
                table: "attendees");

            migrationBuilder.RenameTable(
                name: "attendees",
                newName: "Attendees");

            migrationBuilder.RenameTable(
                name: "assignments",
                newName: "Assignments");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Attendees",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "phone",
                table: "Attendees",
                newName: "Phone");

            migrationBuilder.RenameColumn(
                name: "notes",
                table: "Attendees",
                newName: "Notes");

            migrationBuilder.RenameColumn(
                name: "email",
                table: "Attendees",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "department",
                table: "Attendees",
                newName: "Department");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Attendees",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "full_name",
                table: "Attendees",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "event_id",
                table: "Attendees",
                newName: "EventId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Attendees",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "title",
                table: "Attendees",
                newName: "UpdatedBy");

            migrationBuilder.RenameColumn(
                name: "position",
                table: "Attendees",
                newName: "CreatedBy");

            migrationBuilder.RenameIndex(
                name: "IX_attendees_event_id",
                table: "Attendees",
                newName: "IX_Attendees_EventId");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Assignments",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Assignments",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "event_id",
                table: "Assignments",
                newName: "EventId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Assignments",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "attendee_id",
                table: "Assignments",
                newName: "AttendeeId");

            migrationBuilder.RenameColumn(
                name: "element_id",
                table: "Assignments",
                newName: "SeatId");

            migrationBuilder.RenameIndex(
                name: "IX_assignments_element_id",
                table: "Assignments",
                newName: "IX_Assignments_SeatId");

            migrationBuilder.RenameIndex(
                name: "IX_assignments_attendee_id",
                table: "Assignments",
                newName: "IX_Assignments_AttendeeId");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Halls",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Halls",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Attendees",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Attendees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Assignments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Assignments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Assignments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Assignments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Attendees",
                table: "Attendees",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Assignments",
                table: "Assignments",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HallId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EventDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Events_Halls_HallId",
                        column: x => x.HallId,
                        principalTable: "Halls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Seats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HallId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ColIndex = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RowIndex = table.Column<int>(type: "int", nullable: false),
                    SeatType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Seats_Halls_HallId",
                        column: x => x.HallId,
                        principalTable: "Halls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_EventId",
                table: "Assignments",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_HallId",
                table: "Events",
                column: "HallId");

            migrationBuilder.CreateIndex(
                name: "IX_Seats_HallId_RowIndex_ColIndex",
                table: "Seats",
                columns: new[] { "HallId", "RowIndex", "ColIndex" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Attendees_AttendeeId",
                table: "Assignments",
                column: "AttendeeId",
                principalTable: "Attendees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Events_EventId",
                table: "Assignments",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Seats_SeatId",
                table: "Assignments",
                column: "SeatId",
                principalTable: "Seats",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Attendees_Events_EventId",
                table: "Attendees",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
