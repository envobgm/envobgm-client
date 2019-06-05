export default function notify(title, body, icon) {
  const nitification = new window.Notification(title, { body, icon });

  nitification.onclick = () => {
    // @TODO
  };
}
