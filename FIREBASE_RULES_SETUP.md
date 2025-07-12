# Firebase Security Rules Setup

## How to Apply These Rules

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select your project: `raednusairat-68b52`

2. **Navigate to Realtime Database**
   - In the left sidebar, click on "Realtime Database"
   - Click on the "Rules" tab at the top

3. **Replace Current Rules**
   - Copy the content from `firebase-rules.json`
   - Paste it into the rules editor
   - Click "Publish" to apply the changes

## What These Rules Do

### ✅ **Allow Operations:**
- **Read units data**: Any authenticated user can read units and lessons
- **Read own progress**: Users can only read their own progress data
- **Write own progress**: Users can only write to their own progress data
- **Video positions**: Users can save and load video positions for their lessons
- **Study streaks**: Users can track their study dates for streak calculation

### ❌ **Deny Operations:**
- **Read other users' progress**: Users cannot see other users' progress
- **Write to units**: Users cannot modify the lesson content
- **Write to other users' progress**: Users cannot modify other users' progress
- **Unauthenticated access**: All operations require authentication

## Database Structure

The rules expect this structure:

```
{
  "units": {
    "Unit-1": {
      "Lesson-1": {
        "videoURL": "video1.mp4",
        "thumbnailURL": "thumb1.jpg",
        "description": "Lesson description"
      }
    }
  },
  "progress": {
    "{userId}": {
      "{unitId}": {
        "{lessonId}": {
          "completed": true,
          "completedDate": "2025-07-12",
          "timestamp": 1720800000000,
          "lastPosition": 120.5
        }
      },
      "lastStudyDates": ["2025-07-12", "2025-07-11"]
    }
  }
}
```

## Validation Rules

- `completed`: Must be boolean (true/false)
- `completedDate`: Must be string (ISO date format)
- `timestamp`: Must be number (Unix timestamp)
- `lastPosition`: Must be number ≥ 0 (video position in seconds)
- `lastStudyDates`: Must be an array of dates

## Benefits of Firebase vs localStorage

✅ **Cross-device sync**: Progress syncs across all devices
✅ **Persistent**: Data never gets lost when clearing browser
✅ **Secure**: Server-side validation and user isolation
✅ **Real-time**: Immediate updates across sessions
✅ **Backup**: Automatic cloud backup

## Testing

After applying the rules, test these scenarios:
1. Log in and watch a video - position should save
2. Close and reopen the lesson - should resume from saved position
3. Complete a lesson - should mark as completed in progress page
4. Check progress page - should show updated statistics
