import React from 'react';

/**
 * Renders the 10-digit number pad and carrier selection logic for the EmailJS bypass
 */
export default function SmsNumpadGateway({
  notifyPhone,
  setNotifyPhone,
  notifyCarrier,
  setNotifyCarrier,
  emailSending,
  sendEmailNotification
}) {
  return (
    <>
      <p className="kiosk__sms-label">📱 Want a text when your order is ready?</p>
      <div className="kiosk__sms-gateway-container">
        <div className="kiosk__numpad-display">
          <div className="kiosk__numpad-display-text">
            {notifyPhone ? notifyPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'Enter 10-digit number'}
          </div>
        </div>
        <div className="kiosk__numpad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clear', 0, '⌫'].map(key => (
            <button
              key={key}
              className={`kiosk__numpad-btn ${typeof key === 'string' ? 'kiosk__numpad-btn--action' : ''}`}
              onClick={() => {
                if (key === 'Clear') setNotifyPhone('')
                else if (key === '⌫') setNotifyPhone(prev => prev.slice(0, -1))
                else if (notifyPhone.length < 10) setNotifyPhone(prev => prev + key)
              }}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="kiosk__carrier-select">
          <p className="kiosk__carrier-label">Select Carrier:</p>
          <div className="kiosk__carrier-buttons">
            {[
              { label: 'AT&T', domain: '@txt.att.net' },
              { label: 'Verizon', domain: '@vtext.com' },
              { label: 'T-Mobile', domain: '@tmomail.net' },
              { label: 'Sprint', domain: '@messaging.sprintpcs.com' }
            ].map(carrier => (
              <button
                key={carrier.label}
                className={`kiosk__carrier-btn ${notifyCarrier === carrier.domain ? 'kiosk__carrier-btn--active' : ''}`}
                onClick={() => setNotifyCarrier(carrier.domain)}
              >
                {carrier.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="kiosk__sms-btn"
          onClick={sendEmailNotification}
          disabled={emailSending || notifyPhone.length !== 10 || !notifyCarrier}
        >
          {emailSending ? '...' : 'Text Me'}
        </button>
      </div>
    </>
  );
}
