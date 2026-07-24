"use client";

import { useState, type SubmitEvent } from "react";
import {
  ArrowRight,
  LocateFixed,
  LockKeyhole,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LocationLookup() {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);

  function openPilotBallot() {
    window.location.assign("/ballot?zip=11557");
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!address.trim()) {
      setMessage("Enter a street address or ZIP code to continue.");
      return;
    }
    openPilotBallot();
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage(
        "Location access is not available in this browser. Enter an address instead.",
      );
      return;
    }

    setLocating(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false);
        openPilotBallot();
      },
      () => {
        setLocating(false);
        setMessage(
          "We couldn’t use your location. You can still enter an address or ZIP code.",
        );
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <Card className="border-border/90 shadow-xl shadow-foreground/[0.04]">
      <CardHeader className="gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MapPin className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl">Find what’s on your ballot</CardTitle>
        <CardDescription className="text-sm leading-6">
          Your street address determines every district and race. ZIP code
          alone may not be precise enough for a final ballot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voter-address">Home address or ZIP code</Label>
            <Input
              id="voter-address"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setMessage("");
              }}
              placeholder="Try 11557 for the NY-04 pilot"
              autoComplete="street-address"
              aria-describedby="address-privacy address-message"
              className="h-11"
            />
          </div>

          {message && (
            <output
              id="address-message"
              className="text-sm text-rose-800"
            >
              {message}
            </output>
          )}

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Button type="submit" size="lg" className="h-11 justify-between">
              Find my ballot
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11"
              onClick={useCurrentLocation}
              disabled={locating}
            >
              <LocateFixed data-icon="inline-start" aria-hidden="true" />
              {locating ? "Locating…" : "Use current location"}
            </Button>
          </div>

          <p
            id="address-privacy"
            className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
          >
            <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Prototype privacy: your address stays in this browser and is not
            saved. Both inputs open the 11557 pilot ballot.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
