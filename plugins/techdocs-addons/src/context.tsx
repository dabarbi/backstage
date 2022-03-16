/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CompoundEntityRef } from '@backstage/catalog-model';
import { useApi, useApp } from '@backstage/core-plugin-api';
import {
  techdocsApiRef,
  TechDocsEntityMetadata,
  TechDocsMetadata,
} from '@backstage/plugin-techdocs';
import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import useAsync from 'react-use/lib/useAsync';

type PropsWithEntityName = PropsWithChildren<{ entityName: CompoundEntityRef }>;

const TechDocsMetadataContext = createContext<TechDocsMetadata | undefined>(
  undefined,
);

export const TechDocsMetadataProvider = ({
  entityName,
  children,
}: PropsWithEntityName) => {
  const { NotFoundErrorPage } = useApp().getComponents();
  const techdocsApi = useApi(techdocsApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await techdocsApi.getTechDocsMetadata(entityName);
  }, []);

  if (!loading && error) {
    return <NotFoundErrorPage />;
  }

  return (
    <TechDocsMetadataContext.Provider value={value}>
      {children}
    </TechDocsMetadataContext.Provider>
  );
};

/**
 * Hook for use within TechDocs addons to retrieve TechDocs Metadata for the
 * current TechDocs site.
 * @public
 */
export const useMetadata = () => {
  return useContext(TechDocsMetadataContext);
};

const TechDocsEntityContext = createContext<TechDocsEntityMetadata | undefined>(
  undefined,
);

export const TechDocsEntityProvider = ({
  entityName,
  children,
}: PropsWithEntityName) => {
  const { NotFoundErrorPage } = useApp().getComponents();
  const techdocsApi = useApi(techdocsApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await techdocsApi.getEntityMetadata(entityName);
  }, []);

  if (!loading && error) {
    return <NotFoundErrorPage />;
  }

  return (
    <TechDocsEntityContext.Provider value={value}>
      {children}
    </TechDocsEntityContext.Provider>
  );
};

/**
 * Hook for use within TechDocs addons to retrieve Entity Metadata for the
 * current TechDocs site.
 * @public
 */
export const useEntityMetadata = () => {
  return useContext(TechDocsEntityContext);
};

export type TechDocsReaderPageValue = {
  entityName: CompoundEntityRef;
  shadowRoot?: ShadowRoot;
  setShadowRoot: Dispatch<SetStateAction<ShadowRoot | undefined>>;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  subtitle: string;
  setSubtitle: Dispatch<SetStateAction<string>>;
};

export const defaultTechDocsReaderPageValue: TechDocsReaderPageValue = {
  title: '',
  setTitle: () => {},
  subtitle: '',
  setSubtitle: () => {},
  setShadowRoot: () => {},
  entityName: { kind: '', name: '', namespace: '' },
};

export const TechDocsReaderPageContext = createContext<TechDocsReaderPageValue>(
  defaultTechDocsReaderPageValue,
);

export const useTechDocsReaderPage = () => {
  return useContext(TechDocsReaderPageContext);
};

export const TechDocsReaderPageProvider = ({
  entityName,
  children,
}: PropsWithEntityName) => {
  const [title, setTitle] = useState(defaultTechDocsReaderPageValue.title);
  const [subtitle, setSubtitle] = useState(
    defaultTechDocsReaderPageValue.subtitle,
  );
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | undefined>(
    defaultTechDocsReaderPageValue.shadowRoot,
  );

  const value = {
    entityName,
    shadowRoot,
    setShadowRoot,
    title,
    setTitle,
    subtitle,
    setSubtitle,
  };

  return (
    <TechDocsReaderPageContext.Provider value={value}>
      {children}
    </TechDocsReaderPageContext.Provider>
  );
};

/**
 * Hook for use within TechDocs addons that provides access to the underlying
 * shadow root of the current page, allowing the DOM within to be mutated.
 * @public
 */
export const useShadowRoot = () => {
  const { shadowRoot } = useTechDocsReaderPage();
  return shadowRoot;
};

/**
 * Convenience hook for use within TechDocs addons that provides access to
 * elements that match a given selector within the shadow root.
 *
 * todo(backstage/techdocs-core): Consider extending `selectors` from string[]
 * to some kind of typed object array, so users have more control over the
 * shape of the result. e.g. a flag to indicate querySelector vs.
 * querySelectorAll.
 *
 * @public
 */
export const useShadowRootElements = <T extends HTMLElement = HTMLElement>(
  selectors: string[],
): T[] => {
  const shadowRoot = useShadowRoot();
  if (!shadowRoot) return [];
  return selectors
    .map(selector => shadowRoot?.querySelectorAll<T>(selector))
    .filter(nodeList => nodeList.length)
    .map(nodeList => Array.from(nodeList))
    .flat();
};
