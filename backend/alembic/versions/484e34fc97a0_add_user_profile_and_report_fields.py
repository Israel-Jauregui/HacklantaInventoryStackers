"""add_user_profile_and_report_fields

Revision ID: 484e34fc97a0
Revises: 
Create Date: 2026-03-28 13:22:31.877296

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '484e34fc97a0'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns to users table
    op.add_column('users', sa.Column('username', sa.String(length=50), nullable=False, server_default=''))
    op.add_column('users', sa.Column('profile_picture', sa.String(), nullable=True))
    
    # Remove the server default after adding the column (username should be required for new rows)
    op.alter_column('users', 'username', server_default=None)
    
    # Add new columns to reports table
    op.add_column('reports', sa.Column('address', sa.String(), nullable=False, server_default=''))
    op.add_column('reports', sa.Column('severity_score', sa.Float(), nullable=False, server_default='0'))
    op.add_column('reports', sa.Column('status', sa.String(), nullable=False, server_default='open'))
    op.add_column('reports', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    
    # Remove the server defaults after adding columns
    op.alter_column('reports', 'address', server_default=None)
    op.alter_column('reports', 'severity_score', server_default=None)
    op.alter_column('reports', 'status', server_default=None)
    op.alter_column('reports', 'updated_at', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove columns from reports table
    op.drop_column('reports', 'updated_at')
    op.drop_column('reports', 'status')
    op.drop_column('reports', 'severity_score')
    op.drop_column('reports', 'address')
    
    # Remove columns from users table
    op.drop_column('users', 'profile_picture')
    op.drop_column('users', 'username')
