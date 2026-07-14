from app.core.database import Base
from app.models.department import Department
from app.models.category import Category, PriorityLevel
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus
from app.models.ticket_comment import TicketComment
from app.models.ticket_history import TicketHistory, ActionType
from app.models.notification import Notification

# Alembic'in tüm modelleri bulabilmesi için bu dosyayı içe aktarması yeterli olacaktır.
