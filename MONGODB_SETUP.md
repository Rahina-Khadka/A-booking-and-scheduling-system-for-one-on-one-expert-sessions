# MongoDB Atlas Setup Guide

Follow these steps to set up a publicly available MongoDB database using MongoDB Atlas:

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Verify your email address

## Step 2: Create a Cluster

1. After logging in, click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred cloud provider and region
4. Name your cluster (default: "Cluster0")
5. Click "Create Cluster"

## Step 3: Create Database User

1. In the Security section, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and strong password
5. Set privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access

1. In the Security section, click "Network Access"
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note**: For production, restrict to specific IPs
4. Click "Confirm"

## Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string

## Step 6: Update Your .env File

Replace the connection string in your `.env` file:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/booking_system?retryWrites=true&w=majority
```

Replace:
- `<username>` with your database username
- `<password>` with your database password
- `cluster0.xxxxx.mongodb.net` with your actual cluster URL

## Example Connection String

```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/booking_system?retryWrites=true&w=majority
```

## Security Best Practices

1. **Strong Passwords**: Use complex passwords for database users
2. **IP Whitelisting**: In production, only allow specific IP addresses
3. **Environment Variables**: Never commit credentials to version control
4. **Regular Rotation**: Rotate passwords periodically
5. **Monitoring**: Enable Atlas monitoring and alerts

## Testing the Connection

After updating your `.env` file:

1. Start your application: `npm start`
2. Check the console for "Connected to MongoDB"
3. Try registering a new user to test database operations

## Troubleshooting

**Connection Issues:**
- Verify username/password are correct
- Check if your IP is whitelisted
- Ensure the database name matches your connection string

**Authentication Errors:**
- Double-check database user permissions
- Verify the password doesn't contain special characters that need URL encoding

**Network Timeouts:**
- Check your internet connection
- Verify the cluster region is accessible from your location

## Production Considerations

1. **Dedicated Clusters**: Upgrade from M0 for production workloads
2. **Backup Strategy**: Enable automated backups
3. **Monitoring**: Set up performance and security alerts
4. **Scaling**: Configure auto-scaling based on usage
5. **Security**: Implement database-level security rules