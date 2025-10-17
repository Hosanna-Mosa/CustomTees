export function Settings() {
  return (
    <section>
      <h2>Settings</h2>
      <p>Application settings (dummy).</p>
      <form className="form">
        <label>
          <span>Store Name</span>
          <input defaultValue="CustomTees" />
        </label>
        <label>
          <span>Support Email</span>
          <input defaultValue="support@customtees.local" />
        </label>
        <button className="primary" type="button">Save Changes</button>
      </form>
    </section>
  )
}


