/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene } from './components/Scene';
import { HUD } from './components/HUD';

export default function App() {
  return (
    <div className="absolute inset-0 bg-black overflow-hidden font-sans text-white">
      <Scene />
      <HUD />
    </div>
  );
}
