import os
import glob
import re

backend_dir = "/home/emrekt/Desktop/Corporate-Helpdesk/backend/app/api/v1"

# We want to remove blocks like:
# if current_user.role == UserRole.EMPLOYEE:
#     raise HTTPException(...)
# or:
# if current_user.role == UserRole.EMPLOYEE and ...:
#     raise HTTPException(...)
# or:
# if current_user.role == UserRole.EMPLOYEE:
#     is_internal = False
# We will do this carefully using regex.

for filepath in glob.glob(os.path.join(backend_dir, "*.py")):
    with open(filepath, "r") as f:
        content = f.read()

    # Match `if current_user.role == UserRole.EMPLOYEE` followed by its block
    # We find 'if ... UserRole.EMPLOYEE...:' and the next lines that are indented more than the 'if'
    # Or we can just do simple replace for the common ones.
    
    # 1. remove `if current_user.role == UserRole.EMPLOYEE:\n        raise HTTPException(...)`
    content = re.sub(r'^[ \t]*if current_user\.role == UserRole\.EMPLOYEE:.*?raise HTTPException[^\n]*\n', '', content, flags=re.MULTILINE | re.DOTALL)
    
    # 2. remove `if current_user.role == UserRole.EMPLOYEE and ...:\n        raise HTTPException(...)`
    content = re.sub(r'^[ \t]*if current_user\.role == UserRole\.EMPLOYEE and.*?:.*?raise HTTPException[^\n]*\n', '', content, flags=re.MULTILINE | re.DOTALL)
    
    # 3. remove `if user.role == UserRole.EMPLOYEE and ...:\n        raise HTTPException(...)` or websocket.close(...)
    content = re.sub(r'^[ \t]*if user\.role == UserRole\.EMPLOYEE and.*?:.*?(?:raise HTTPException|await websocket\.close)[^\n]*\n[ \t]*return\n', '', content, flags=re.MULTILINE | re.DOTALL)
    content = re.sub(r'^[ \t]*if user\.role == UserRole\.EMPLOYEE and.*?:.*?(?:raise HTTPException|await websocket\.close)[^\n]*\n', '', content, flags=re.MULTILINE | re.DOTALL)

    # 4. remove `if current_user.role == UserRole.EMPLOYEE:\n        query = query.filter(...)`
    content = re.sub(r'^[ \t]*if current_user\.role == UserRole\.EMPLOYEE:\n[ \t]*query = query\.filter\([^\n]*\n', '', content, flags=re.MULTILINE)

    # 5. remove `if current_user.role == UserRole.EMPLOYEE:\n        is_internal = False\n`
    content = re.sub(r'^[ \t]*if current_user\.role == UserRole\.EMPLOYEE:\n[ \t]*is_internal = False\n', '', content, flags=re.MULTILINE)

    # 6. `if current_user.role != UserRole.EMPLOYEE:` -> `if current_user.role == UserRole.ADMIN:`
    content = content.replace("if current_user.role != UserRole.EMPLOYEE:", "if current_user.role == UserRole.ADMIN:")
    
    with open(filepath, "w") as f:
        f.write(content)

print("Replacement complete.")
