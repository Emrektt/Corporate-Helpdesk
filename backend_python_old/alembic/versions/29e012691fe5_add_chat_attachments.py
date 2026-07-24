"""add_chat_attachments

Revision ID: 29e012691fe5
Revises: 311bd8cf1292
Create Date: 2026-07-24 13:34:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '29e012691fe5'
down_revision = '311bd8cf1292'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('chat_messages', sa.Column('attachment_url', sa.String(), nullable=True))
    op.add_column('chat_messages', sa.Column('attachment_type', sa.String(), nullable=True))
    op.add_column('chat_messages', sa.Column('attachment_name', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('chat_messages', 'attachment_name')
    op.drop_column('chat_messages', 'attachment_type')
    op.drop_column('chat_messages', 'attachment_url')
