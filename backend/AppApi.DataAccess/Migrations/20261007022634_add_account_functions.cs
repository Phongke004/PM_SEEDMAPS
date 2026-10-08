using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppApi.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class add_account_functions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "account_functions",
                columns: table => new
                {
                    AccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FunctionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_account_functions", x => new { x.AccountId, x.FunctionId });
                    table.ForeignKey(
                        name: "FK_account_functions_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_account_functions_app_functions_FunctionId",
                        column: x => x.FunctionId,
                        principalTable: "app_functions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_account_functions_FunctionId",
                table: "account_functions",
                column: "FunctionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "account_functions");
        }
    }
}
