import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

HOST     = os.getenv("MYSQL_HOST", "localhost")
DATABASE = os.getenv("MYSQL_DATABASE")
USERNAME = os.getenv("MYSQL_USERNAME")
PASSWORD = os.getenv("MYSQL_PASSWORD")


def get_connection():
    conn = mysql.connector.connect(
        host=HOST,
        database=DATABASE,
        user=USERNAME,
        password=PASSWORD
    )
    return conn


def fetchall_as_dict(cursor):
    cols = [col[0] for col in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def fetchone_as_dict(cursor):
    cols = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None
