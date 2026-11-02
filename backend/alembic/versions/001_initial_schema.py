"""Initial database schema for PawSOS Animal Emergency Rescue Network

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('phone_number', sa.String(50), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, default='Citizen'),
        sa.Column('service_area', sa.String(255), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )

    # 2. organizations table
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organization_name', sa.String(255), nullable=False),
        sa.Column('organization_type', sa.String(100), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('service_area', sa.String(255), nullable=False),
        sa.Column('verification_status', sa.String(50), nullable=False, default='Pending'),
        sa.Column('contact_phone', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    # 3. rescue_reports table
    op.create_table(
        'rescue_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('case_id', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('reporter_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reporter_name', sa.String(255), nullable=False),
        sa.Column('reporter_phone', sa.String(50), nullable=False),
        sa.Column('animal_type', sa.String(100), nullable=False),
        sa.Column('condition', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('photo_url', sa.Text(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('landmark', sa.String(255), nullable=True),
        sa.Column('urgency', sa.String(50), nullable=False, default='Moderate'),
        sa.Column('status', sa.String(50), nullable=False, default='Reported'),
        sa.Column('verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('reported_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )

    # 4. rescue_assignments table
    op.create_table(
        'rescue_assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('rescue_report_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('rescue_reports.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rescuer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('assigned_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, default='Assigned')
    )

    # 5. veterinary_records table
    op.create_table(
        'veterinary_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('rescue_report_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('rescue_reports.id', ondelete='CASCADE'), nullable=False),
        sa.Column('vet_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('diagnosis', sa.Text(), nullable=False),
        sa.Column('treatment', sa.Text(), nullable=False),
        sa.Column('recovery_status', sa.String(100), nullable=False, default='Under Observation'),
        sa.Column('treated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    # 6. rescue_timeline table
    op.create_table(
        'rescue_timeline',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('rescue_report_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('rescue_reports.id', ondelete='CASCADE'), nullable=False),
        sa.Column('stage', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('actor_name', sa.String(255), nullable=True),
        sa.Column('actor_role', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    # 7. rescuer_availability table
    op.create_table(
        'rescuer_availability',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('rescuer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('availability_status', sa.String(50), nullable=False, default='Available'),
        sa.Column('service_area', sa.String(255), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )

    # 8. audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('target_type', sa.String(100), nullable=False),
        sa.Column('target_id', sa.String(255), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('rescuer_availability')
    op.drop_table('rescue_timeline')
    op.drop_table('veterinary_records')
    op.drop_table('rescue_assignments')
    op.drop_table('rescue_reports')
    op.drop_table('organizations')
    op.drop_table('users')
