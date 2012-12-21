from model_sqla.config import DBUSER, DBTYPE, DBPASS, DBHOST, DBNAME
from sqlalchemy.engine import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.schema import MetaData
from sqlalchemy.schema import Column
from sqlalchemy.types  import String, Boolean, DateTime

Base = declarative_base()
metadata = MetaData()
engine = create_engine("%s://%s:%s@%s/%s" % (DBTYPE, DBUSER, DBPASS, DBHOST, DBNAME), convert_unicode=True, pool_recycle=3600)


def subclasses(cls):
    return map(lambda x: x.__mapper_args__['polymorphic_identity'], cls.__subclasses__())


class CommonEqualityMixin(object):
    '''Mixin class for related table equality / inequality'''

    def __eq__(self, other):
        if type(other) is type(self):
            return reduce(lambda x, y: x and (y == '_sa_instance_state' or self.__dict__[y] == other.__dict__[y]), self.__dict__.keys(), True)
        return False

    def __ne__(self, other):
        return not self.__eq__(other)


class ENCODEdTable(Base):
    ''' All tables in ENCODEd have these fields '''

    date_created = Column('date_created', DateTime, nullable=False)
    created_by = Column('created_by', String, nullable=False)
    is_current = Column('is_current', Boolean, nullable=False)