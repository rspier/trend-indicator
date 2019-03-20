// eventsource is a sample source for the trend indicator extension.
package main

/*
Copyright 2019 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	eventsource "gopkg.in/antage/eventsource.v1"
)

var lastJSON string

// lastEvent resends the last event, useful for bootstrapping.
func lastEvent(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if len(lastJSON) == 0 {
		w.WriteHeader(http.StatusTooEarly)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(lastJSON))
}

// NewEventSource creates an EventSource with some custom settings and headers
// to prevent caching and allow access from anywhere.
func NewEventSource() eventsource.EventSource {
	es := eventsource.New(
		&eventsource.Settings{
			Timeout:        60 * time.Second,
			CloseOnTimeout: false,
			IdleTimeout:    30 * time.Minute,
		},
		func(req *http.Request) [][]byte {
			return [][]byte{
				[]byte("X-Accel-Buffering: no"),
				[]byte("Access-Control-Allow-Origin: *"),
			}
		})
	es.SendRetryMessage(15 * time.Second) // too low?
	return es
}

type pushMessage struct {
	Value     string `json:"value"`
	Timestamp int64  `json:"timestamp"`
	Trend     int    `json:"trend"`
}

func loop(es eventsource.EventSource, wait time.Duration) {
	for {
		v := rand.Int31n(1000) // 0-999
		t := rand.Int31n(10)   // 0-9

		p := pushMessage{
			Value:     fmt.Sprintf("%d", v),
			Timestamp: time.Now().Unix(),
			Trend:     int(t),
		}

		j, err := json.Marshal(p)
		if err != nil {
			log.Fatal(err)
		}
		lastJSON = string(j)
		es.SendEventMessage(lastJSON, "message", fmt.Sprintf("%v", time.Now().Unix()))

		time.Sleep(wait)
	}
}

func main() {
	var port = flag.Int("port", 7080, "port for http server to listen on")
	var wait = flag.Duration("wait", 10*time.Second, "how long to wait between events")
	flag.Parse()

	es := NewEventSource()

	http.Handle("/events", es)
	http.HandleFunc("/events/last", lastEvent)

	go loop(es, wait)

	log.Fatal(http.ListenAndServe(":"+strconv.Itoa(*port), nil))
}
