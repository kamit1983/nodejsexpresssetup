import {
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import express, { Request, Response } from 'express';

import { RegistrationCredential } from '@simplewebauthn/typescript-types';
import base64url from 'base64url';

const fpRouter = express.Router();

const users = new Map<string, any>();

const rpName = 'Linarc-POC';
const rpID = 'localhost';
const origin = `http://${rpID}:5173`; // Change this to your frontend origin if different

// -------- Registration Step 1: Generate Options --------
fpRouter.post('/generate-registration-options', async (req: Request, res: Response) => {
  const { username } = req.body;
  const userId = username;

  const user: any = users.get(username) || {
    id: userId,
    username,
    devices: [],
  };

  users.set(username, user);
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.username,
    // Don't prompt users for additional information about the authenticator
    // (Recommended for smoother UX)
    attestationType: 'none',
    // Prevent users from re-registering existing authenticators
    excludeCredentials: [],
    // See "Guiding use of authenticators via authenticatorSelection" below
    authenticatorSelection: {
      // Defaults
      residentKey: 'preferred',
      userVerification: 'preferred',
      // Optional
      authenticatorAttachment: 'platform',
    },
  });
  user.currentChallenge = options.challenge;
  res.json(options);
});

// -------- Registration Step 2: Verify Attestation --------
fpRouter.post('/verify-registration', async (req: Request, res: Response) => {
  const { username, attestationResponse } = req.body;
  const user = users.get(username);

  if (!user) return res.status(400).json({ error: 'User not found' });

  try {
    const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { publicKey, id, counter } = registrationInfo.credential;
      
      const existingDevice = user.devices.find((dev: any) =>
        dev.credentialID.equals(id),
      );

      if (!existingDevice) {
        user.devices.push({
          id,
          publicKey,
          counter,
        });
      }
    }
    res.json({ verified });
  } catch (err: any) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
});

// -------- Authentication Step 1: Generate Options --------
fpRouter.post('/generate-authentication-options', async (req: Request, res: Response) => {
  const { username } = req.body;
  const user = users.get(username);

  if (!user) return res.status(400).json({ error: 'User not found' });

  const options = await generateAuthenticationOptions({
    timeout: 60000,
    rpID,
    userVerification: 'required',
    allowCredentials: user.devices.map((dev: any) => ({
      id: dev.id,
      transports: ['internal'],
    })),
  });

  user.currentChallenge = options.challenge;

  res.json(options);
});

// -------- Authentication Step 2: Verify Assertion --------
fpRouter.post('/verify-authentication', async (req: Request, res: Response) => {
  const { username, assertionResponse } = req.body;
  const user = users.get(username);

  if (!user) return res.status(400).json({ error: 'User not found' });

  const credentialID = assertionResponse.rawId;
  const authenticator = user.devices.find((dev: any) =>
    dev.id === credentialID,
  );

  if (!authenticator) return res.status(400).json({ error: 'Authenticator not registered' });

  try {
    const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential:{
        id: authenticator.id,
        publicKey: authenticator.publicKey,
        counter: authenticator.counter,
        transports: ['internal'],
      },
    });

    const { verified, authenticationInfo } = verification;

    if (verified) {
      authenticator.counter = authenticationInfo.newCounter;
    }

    res.json({ verified });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export { fpRouter };
