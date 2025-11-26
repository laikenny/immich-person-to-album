# Immich Person-to-Album (Extended)

Automatically sync Immich photos to albums based on detected people with advanced AND/OR/NOT filtering operations.

**Docker Hub**: You're looking at it!  
**Source Code**: [GitHub - laikenny/immich-person-to-album](https://github.com/laikenny/immich-person-to-album)  
**Original Project**: [alangrainger/immich-person-to-album](https://github.com/alangrainger/immich-person-to-album)

---

## 🚀 Quick Start

### 1. Create docker-compose.yml

```yaml
services:
  immich-person-to-album:
    image: suwagusan/immich-person-to-album:latest
    container_name: immich-person-to-album
    restart: always
    volumes:
      - ./data:/data
    networks:
      - immich_default  # Use your Immich network name

networks:
  immich_default:
    external: true
```

### 2. Create data/config.json

```json
{
  "immichServer": "http://immich-server:2283",
  "schedule": "*/30 * * * *",
  "users": [
    {
      "apiKey": "YOUR_IMMICH_API_KEY",
      "personLinks": [
        {
          "description": "Photos of both kids together",
          "personIds": ["person-a-id", "person-b-id"],
          "operation": "AND",
          "albumId": "album-id"
        }
      ]
    }
  ]
}
```

### 3. Start the Container

```bash
docker-compose up -d
```

### 4. Check Logs

```bash
docker logs -f immich-person-to-album
```

---

## ⚙️ Configuration

### Get Your API Key

1. Open Immich → Click profile picture
2. **Account Settings** → **API Keys**
3. Click **New API Key**
4. Permissions: `asset.read` and `albumAsset.create`
5. Copy the key to your `config.json`

### Get Person IDs

1. Immich → **Explore** → **People**
2. Click on a person
3. Copy ID from URL: `http://immich/people/f3437c84-83f9-...`
4. Person ID: `f3437c84-83f9-...`

### Get Album IDs

1. Immich → **Albums**
2. Click on an album
3. Copy ID from URL: `http://immich/albums/ff85e8c5-32e6-...`
4. Album ID: `ff85e8c5-32e6-...`

---

## 🎯 Advanced Filtering (Extended Features)

This fork adds powerful filtering operations not available in the original project.

### ✅ AND Operation
Photos with **ALL** specified people together:

```json
{
  "description": "Both kids together",
  "personIds": ["kid-1-id", "kid-2-id"],
  "operation": "AND",
  "albumId": "both-kids-album"
}
```

### ✅ OR Operation (Default)
Photos with **ANY** of the specified people:

```json
{
  "description": "Either kid",
  "personIds": ["kid-1-id", "kid-2-id"],
  "operation": "OR",
  "albumId": "any-kid-album"
}
```

### ✅ NOT Operation
Exclude specific people:

```json
{
  "description": "Kid 1 without Kid 2",
  "personId": "kid-1-id",
  "excludePersonIds": ["kid-2-id"],
  "albumId": "kid-1-solo-album"
}
```

### ✅ Exclude Others
Photos with **ONLY** specified people (no one else):

```json
{
  "description": "Family of 4 only - no friends",
  "personIds": ["dad-id", "mom-id", "kid-1-id", "kid-2-id"],
  "operation": "AND",
  "excludeOthers": true,
  "albumId": "family-only-album"
}
```

### Combined Operations

**Both kids, but not with parents:**
```json
{
  "personIds": ["kid-1-id", "kid-2-id"],
  "operation": "AND",
  "excludePersonIds": ["dad-id", "mom-id"],
  "albumId": "kids-alone-album"
}
```

**Solo photos (person alone, no one else):**
```json
{
  "personId": "kid-1-id",
  "excludeOthers": true,
  "albumId": "kid-1-solo-album"
}
```

---

## 📋 Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | No | Human-readable description |
| `personId` | string | Yes* | Single person ID (original syntax) |
| `personIds` | array | Yes* | Multiple person IDs for AND/OR operations |
| `operation` | string | No | `"OR"` (default) or `"AND"` |
| `excludePersonIds` | array | No | Person IDs to exclude |
| `excludeOthers` | boolean | No | Exclude all other people not specified |
| `albumId` | string | Yes | Target album ID |

*Either `personId` or `personIds` must be specified.

---

## 🔧 Troubleshooting

### Container can't reach Immich

```bash
# Test connectivity from inside container
docker exec immich-person-to-album sh -c "wget -qO- http://immich-server:2283/api/server/ping"

# Should return: {"res":"pong"}
```

**Fix:** Make sure both containers are on the same Docker network.

### Photos not being added

1. Check logs: `docker logs immich-person-to-album`
2. Verify person IDs are correct
3. Verify album IDs are correct
4. Check API key has correct permissions
5. View `/data/store.json` - tracks last processed timestamp

### Reset processing (re-scan all photos)

```bash
# Delete store.json to reprocess everything
rm /path/to/data/store.json
docker restart immich-person-to-album
```

---

## 📅 Schedule Format

Default: `*/30 * * * *` (every 30 minutes)

```
*/5 * * * *   = Every 5 minutes
0 * * * *     = Every hour
0 0 * * *     = Daily at midnight
0 */6 * * *   = Every 6 hours
```

---

## 🚫 Limitations

### Not Supported (Nested Boolean Logic)
- ❌ `(A && B) || (C && D)` - "Both A and B, OR both C and D"
- ❌ `A && (B || C)` - "A and either B or C"

For most use cases, the combination of AND, OR, NOT, and excludeOthers is sufficient.

---

## 🔗 Links

- **Source Code**: [GitHub Repository](https://github.com/laikenny/immich-person-to-album)
- **Development Chat**: [Claude Conversation](https://claude.ai/share/8a705235-5eee-43f8-a8bf-c74bb0cb52db)
- **Original Project**: [alangrainger/immich-person-to-album](https://github.com/alangrainger/immich-person-to-album)
- **Immich**: [immich.app](https://immich.app)

---

## 📝 Complete Example

```json
{
  "immichServer": "http://immich-server:2283",
  "schedule": "*/30 * * * *",
  "users": [
    {
      "apiKey": "your-api-key",
      "personLinks": [
        {
          "description": "Kid 1 individual photos",
          "personId": "kid-1-id",
          "albumId": "kid-1-album"
        },
        {
          "description": "Kid 2 individual photos",
          "personId": "kid-2-id",
          "albumId": "kid-2-album"
        },
        {
          "description": "Both kids together",
          "personIds": ["kid-1-id", "kid-2-id"],
          "operation": "AND",
          "albumId": "both-kids-album"
        },
        {
          "description": "Either kid (or both)",
          "personIds": ["kid-1-id", "kid-2-id"],
          "operation": "OR",
          "albumId": "any-kid-album"
        },
        {
          "description": "Family of 4 only - no one else",
          "personIds": ["dad-id", "mom-id", "kid-1-id", "kid-2-id"],
          "operation": "AND",
          "excludeOthers": true,
          "albumId": "family-exclusive-album"
        }
      ]
    }
  ]
}
```

---

## 🎉 Why This Fork?

**Immich Native Support**: This feature is on Immich's roadmap for late 2025, but not yet implemented.

**Why I Forked**: The original project only supported simple single-person albums. I needed:
- Multiple people with AND/OR logic
- Ability to exclude specific people
- Photos with ONLY specified people (no one else)

**Backward Compatible**: All original configuration syntax still works!

---

## 📄 License

AGPL-3.0 (same as Immich)
