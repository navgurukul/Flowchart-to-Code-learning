# backend/email_service.py
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
import asyncio
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class EmailConfig:
    smtp_server: str
    smtp_port: int
    username: str
    password: str
    from_email: str

@dataclass 
class UserActivity:
    uid: str
    email: str
    display_name: Optional[str]
    current_exercise_id: Optional[int]
    last_active: datetime
    exercise_start_time: Optional[datetime]

class EmailNotificationService:
    def __init__(self):
        self.config = self._load_email_config()
    
    def _load_email_config(self) -> Optional[EmailConfig]:
        """Load email configuration from environment variables"""
        try:
            smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
            smtp_port = int(os.environ.get("SMTP_PORT", "587"))
            username = os.environ.get("SMTP_USERNAME")
            password = os.environ.get("SMTP_PASSWORD") 
            from_email = os.environ.get("SMTP_FROM_EMAIL")
            
            if not all([username, password, from_email]):
                logger.warning("Email configuration incomplete. Email notifications will be disabled.")
                return None
                
            return EmailConfig(
                smtp_server=smtp_server,
                smtp_port=smtp_port,
                username=username,
                password=password,
                from_email=from_email
            )
        except Exception as e:
            logger.error(f"Error loading email configuration: {e}")
            return None
    
    def _create_inactivity_email(self, user: UserActivity, inactive_minutes: int) -> str:
        """Create HTML email content for inactive user notification"""
        exercise_text = f"Exercise {user.current_exercise_id}" if user.current_exercise_id else "a flowchart"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; }}
                .button {{ background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
                .footer {{ background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }}
                .highlight {{ color: #667eea; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Don't Give Up on Your Learning Journey!</h1>
                </div>
                <div class="content">
                    <p>Hi {user.display_name or 'there'},</p>
                    
                    <p>We noticed you've been working on <span class="highlight">{exercise_text}</span> and haven't made progress in the last <span class="highlight">{inactive_minutes} minutes</span>.</p>
                    
                    <p>Learning to code with flowcharts can be challenging, but every expert was once a beginner! Here are some tips to help you get unstuck:</p>
                    
                    <ul>
                        <li>🤔 <strong>Take a step back:</strong> Review the problem statement carefully</li>
                        <li>✏️ <strong>Break it down:</strong> Try sketching the solution on paper first</li>
                        <li>💡 <strong>Use the hints:</strong> Don't hesitate to ask for help using the chat feature</li>
                        <li>🏃‍♂️ <strong>Try the dry run:</strong> Walk through your flowchart step by step</li>
                    </ul>
                    
                    <p>Remember, persistence is key to mastering programming concepts. Every challenge you overcome makes you a stronger developer!</p>
                    
                    <div style="text-align: center;">
                        <a href="https://flowchart-to-code-learning.vercel.app" class="button">Continue Learning 🎯</a>
                    </div>
                    
                    <p>Keep coding,<br>
                    The NavGurukul Learning Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent because you've been inactive on the Flowchart to Code Learning platform.</p>
                    <p>NavGurukul - Empowering through Education</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send an email asynchronously"""
        if not self.config:
            logger.warning("Email configuration not available. Cannot send email.")
            return False
            
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.config.from_email
            msg['To'] = to_email
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email in a separate thread to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._send_email_sync, msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def _send_email_sync(self, msg: MIMEMultipart) -> None:
        """Synchronous email sending"""
        with smtplib.SMTP(self.config.smtp_server, self.config.smtp_port) as server:
            server.starttls()
            server.login(self.config.username, self.config.password)
            server.send_message(msg)
    
    async def send_inactivity_notification(self, user: UserActivity, inactive_minutes: int) -> bool:
        """Send inactivity notification to a user"""
        subject = f"🎯 Don't Give Up! Continue Your Learning Journey"
        html_content = self._create_inactivity_email(user, inactive_minutes)
        
        return await self.send_email(user.email, subject, html_content)
    
    async def send_bulk_inactivity_notifications(self, users: List[UserActivity], inactive_minutes: int) -> Dict[str, bool]:
        """Send inactivity notifications to multiple users"""
        results = {}
        
        # Send emails concurrently but with a small delay to avoid rate limiting
        for i, user in enumerate(users):
            if i > 0:
                await asyncio.sleep(1)  # 1 second delay between emails
            
            result = await self.send_inactivity_notification(user, inactive_minutes)
            results[user.uid] = result
            
        return results

# Create a singleton instance
email_service = EmailNotificationService()