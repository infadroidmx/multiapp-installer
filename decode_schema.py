import base64

with open(r'C:\xampp\htdocs\postiz\schema_b64.txt', 'rb') as f:
    content = f.read()

# Remove UTF-16 BOM and null bytes if present due to powershell redirection
if content.startswith(b'\xff\xfe'):
    content = content[2:].replace(b'\x00', b'')
elif content.startswith(b'\xfe\xff'):
    content = content[2:].replace(b'\x00', b'')

# The content might contain base64 string.
# Let's try to decode it.
try:
    decoded = base64.b64decode(content.strip())
    with open(r'C:\xampp\htdocs\postiz\schema_decoded.prisma', 'wb') as f:
        f.write(decoded)
    print("Successfully decoded to schema_decoded.prisma")
except Exception as e:
    print(f"Error: {e}")
