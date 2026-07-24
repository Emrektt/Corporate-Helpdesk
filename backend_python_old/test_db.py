from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.ticket import Ticket, TicketStatus

engine = create_engine("postgresql://user:password@localhost:5432/helpdesk")
Session = sessionmaker(bind=engine)
db = Session()
ticket = db.query(Ticket).filter(Ticket.id == 14).first()
if ticket:
    print("Status:", repr(ticket.status))
    print("Is CLOSED?", ticket.status == TicketStatus.CLOSED)
    print("Is in list?", ticket.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED])
    print("CSAT score:", ticket.csat_score)
