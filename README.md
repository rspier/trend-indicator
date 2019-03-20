# Trend Indicator

Trend Indicator is a chrome extension that displays a value and the current
trend for that value on a BrowserAction!  It's useful for things like
temperature, inbox level, or anything else with a value < 1000.  The indicator
is updated in real time via a HTML5 EventStream.

## Configuration

The extension must be pointed at a server that serves up a HTML5 EventSource and
a static version of the last event served.

Click on the icon and enter the URL in the obvous box.

## Server

An example server that generates random data can be found in [eventsource.go](eventsource.go).

The server must provide an HTML5 EventSource and a /last endpoint.

For example:

* https://myhost/events/ - this is the HTML5 EventSource
* https://myhost/events/last - this should serve up the content of the last
  message served for bootstrapping.

The only thing that's important in the URL is the `/last` suffix.  `/events` isn't needed.

An appropriate Access-Control-Allow-Origin header must be sent, or Chrome will refuse to process the data.

For example, allow all origins:

```
Access-Control-Allow-Origin: *
```

## Message Content

Messages should have EventSource type `message` and be the JSON representation
of this go struct:

```go
type pushMessage struct {
    // The value of the indicator.
    Value     string `json:"value"`
    // The timestamp of when the value was generated.
    Timestamp int64  `json:"timestamp"`
    // Offset into trend array.
	Trend     int    `json:"trend"`
}
```

For example:

```json
{value: "204", timestamp: 1552878938, trend: 4}
```

### Trend Values

0. (nothing)
1. ↑↑ (up fast)
2. ↑ (up)
3. ↗ (up slowly)
4. → (steady)
5. ↘ (down slowly)
6. ↓ (down) 
7. ↓↓ (down fast) 
8. ❓ (unknown)
9. ⚠️ (problem)

## FAQ

* Why only numbers < 1000?  Because otherwise they're too small to read.

## Disclaimer

This is not an official Google project.
