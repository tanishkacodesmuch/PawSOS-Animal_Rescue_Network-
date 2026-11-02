"""Add partner onboarding, verification, assignment rejection, and veterinary handoff columns

Revision ID: 002_partner_onboarding_and_handoff
Revises: 001_initial_schema
Create Date: 2026-11-01 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_partner_onboarding_and_handoff'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Users table updates
    op.add_column('users', sa.Column('experience_years', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('users', sa.Column('rescue_capabilities', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('clinic_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('clinic_address', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('license_number', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('specializations', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('emergency_24_7', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('reviewed_by', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('is_test_account', sa.Boolean(), nullable=False, server_default='false'))

    # Rescue assignments table updates
    op.add_column('rescue_assignments', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('rescue_assignments', sa.Column('rejected_at', sa.DateTime(timezone=True), nullable=True))

    # Rescue reports table updates
    op.add_column('rescue_reports', sa.Column('assigned_clinic_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True))
    op.add_column('rescue_reports', sa.Column('assigned_clinic_name', sa.String(255), nullable=True))
    op.add_column('rescue_reports', sa.Column('handoff_status', sa.String(50), nullable=True))
    op.add_column('rescue_reports', sa.Column('is_test_case', sa.Boolean(), nullable=False, server_default='false'))

    # Notifications table updates
    op.add_column('notifications', sa.Column('title', sa.String(255), nullable=True))
    op.add_column('notifications', sa.Column('case_id', sa.String(50), nullable=True))

def downgrade() -> None:
    op.drop_column('notifications', 'case_id')
    op.drop_column('notifications', 'title')
    op.drop_column('rescue_reports', 'is_test_case')
    op.drop_column('rescue_reports', 'handoff_status')
    op.drop_column('rescue_reports', 'assigned_clinic_name')
    op.drop_column('rescue_reports', 'assigned_clinic_id')
    op.drop_column('rescue_assignments', 'rejected_at')
    op.drop_column('rescue_assignments', 'rejection_reason')
    op.drop_column('users', 'is_test_account')
    op.drop_column('users', 'reviewed_at')
    op.drop_column('users', 'reviewed_by')
    op.drop_column('users', 'rejection_reason')
    op.drop_column('users', 'emergency_24_7')
    op.drop_column('users', 'specializations')
    op.drop_column('users', 'license_number')
    op.drop_column('users', 'clinic_address')
    op.drop_column('users', 'clinic_name')
    op.drop_column('users', 'rescue_capabilities')
    op.drop_column('users', 'experience_years')
