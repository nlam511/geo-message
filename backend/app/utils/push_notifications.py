from exponent_server_sdk import PushClient, PushMessage

def send_push_notification(token: str, message: str):
    try:
        response = PushClient().publish(
            PushMessage(to=token, body=message)
        )
        print(f"Push notification sent: {response}")
    except Exception as e:
        print(f"An error occurred: {e}")